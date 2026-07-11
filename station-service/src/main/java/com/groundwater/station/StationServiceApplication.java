package com.groundwater.station;

import com.groundwater.station.config.DotenvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@SpringBootApplication
public class StationServiceApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(StationServiceApplication.class);
        app.addInitializers(new DotenvConfig());

        // Resolve credentials from System properties (already loaded by DotenvConfig)
        // then verify the DB is reachable before handing off to Spring.
        verifyDatabaseConnection();

        app.run(args);
    }

    private static void verifyDatabaseConnection() {
        String host     = sysProp("DB_HOST",     "localhost");
        String port     = sysProp("DB_PORT",     "3306");
        String name     = sysProp("DB_NAME",     "groundwater_db");
        String username = sysProp("DB_USERNAME", "root");
        String password = sysProp("DB_PASSWORD", "");

        String url = "jdbc:mysql://" + host + ":" + port + "/" + name
                + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
                + "&connectTimeout=5000";   // fail fast — 5 s max

        System.out.println("──────────────────────────────────────────────");
        System.out.println("  Verifying MySQL connection...");
        System.out.println("  Host : " + host + ":" + port);
        System.out.println("  DB   : " + name);
        System.out.println("  User : " + username);
        System.out.println("──────────────────────────────────────────────");

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            abort("MySQL JDBC driver not found on classpath.", e);
        }

        try (Connection conn = DriverManager.getConnection(url, username, password)) {
            if (conn.isValid(3)) {
                System.out.println("  ✔  Database connection successful.");
                System.out.println("──────────────────────────────────────────────");
            } else {
                abort("Connection obtained but isValid() returned false. Check DB health.", null);
            }
        } catch (SQLException e) {
            System.err.println("──────────────────────────────────────────────");
            System.err.println("  ✘  Cannot connect to MySQL.");
            System.err.println("  Error   : " + e.getMessage());
            System.err.println("  SQLState: " + e.getSQLState());
            System.err.println();
            System.err.println("  Checklist:");
            System.err.println("  1. MySQL is running on " + host + ":" + port);
            System.err.println("  2. Database '" + name + "' exists");
            System.err.println("  3. Credentials in .env are correct");
            System.err.println("  4. User '" + username + "' has access to '" + name + "'");
            System.err.println("──────────────────────────────────────────────");
            System.exit(1);
        }
    }

    private static String sysProp(String key, String fallback) {
        String val = System.getProperty(key);
        if (val == null || val.isBlank()) val = System.getenv(key);
        return (val == null || val.isBlank()) ? fallback : val;
    }

    private static void abort(String message, Exception cause) {
        System.err.println("  ✘  " + message);
        if (cause != null) System.err.println("  Cause: " + cause.getMessage());
        System.exit(1);
    }
}
