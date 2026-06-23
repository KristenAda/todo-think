package com.todothink.core.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        this(message, 400);
    }

    public BusinessException(String message, int code) {
        super(message);
        this.code = code;
    }
}
