package com.todothink.core.exception;

import com.todothink.core.result.Result;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 对齐 Node server/src/middlewares/error.ts
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public org.springframework.http.ResponseEntity<Result<Void>> handleBusiness(BusinessException ex) {
        int code = ex.getCode();
        org.springframework.http.HttpStatus status = org.springframework.http.HttpStatus.BAD_REQUEST;
        if (code == 401) {
            status = org.springframework.http.HttpStatus.UNAUTHORIZED;
        } else if (code == 403) {
            status = org.springframework.http.HttpStatus.FORBIDDEN;
        } else if (code == 404) {
            status = org.springframework.http.HttpStatus.NOT_FOUND;
        } else if (code == 409) {
            status = org.springframework.http.HttpStatus.CONFLICT;
        } else if (code >= 500) {
            status = org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return org.springframework.http.ResponseEntity.status(status)
                .body(Result.error(ex.getMessage(), code));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidation(Exception ex) {
        String message = "参数错误";
        if (ex instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException manv = (MethodArgumentNotValidException) ex;
            if (manv.getBindingResult().getFieldError() != null) {
                message = manv.getBindingResult().getFieldError().getDefaultMessage();
            }
        }
        return Result.error(message, 400);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleOther(Exception ex) {
        return Result.error(ex.getMessage() != null ? ex.getMessage() : "服务器内部错误", 500);
    }
}
