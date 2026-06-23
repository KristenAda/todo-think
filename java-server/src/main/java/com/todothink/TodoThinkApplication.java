package com.todothink;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.todothink.modules.**.mapper")
@EnableScheduling
public class TodoThinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodoThinkApplication.class, args);
    }
}
