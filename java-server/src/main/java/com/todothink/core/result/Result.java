package com.todothink.core.result;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 API 响应，对齐 Node server/src/core/result.ts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success() {
        return success(null, "success");
    }

    public static <T> Result<T> success(T data) {
        return success(data, "success");
    }

    public static <T> Result<T> success(T data, String message) {
        return new Result<>(200, message, data);
    }

    public static <T> Result<PageData<T>> page(java.util.List<T> list, long total, int page, int pageSize) {
        PageData<T> pageData = new PageData<>();
        pageData.setList(list);
        pageData.setTotal(total);
        pageData.setPage(page);
        pageData.setPageSize(pageSize);
        pageData.setTotalPage((int) Math.ceil(total * 1.0 / pageSize));
        return success(pageData);
    }

    public static <T> Result<T> error(String message) {
        return error(message, 500);
    }

    public static <T> Result<T> error(String message, int code) {
        return new Result<>(code, message, null);
    }
}
