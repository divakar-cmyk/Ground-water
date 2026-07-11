package com.groundwater.station.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Loads the .env file (if present) into System properties before Spring
 * resolves ${} placeholders in application.properties.
 *
 * Registered in StationServiceApplication via
 * SpringApplication.addInitializers(new DotenvConfig()).
 */
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()   // safe to run without .env (e.g. in CI with real env vars)
                .load();

        for (DotenvEntry entry : dotenv.entries()) {
            // Only set if not already provided by the OS environment
            if (System.getProperty(entry.getKey()) == null
                    && System.getenv(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        }
    }
}
