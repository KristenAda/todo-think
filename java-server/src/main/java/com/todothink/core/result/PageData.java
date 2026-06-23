package com.todothink.core.result;

import lombok.Data;

import java.util.List;

@Data
public class PageData<T> {

    private List<T> list;
    private long total;
    private int page;
    private int pageSize;
    private int totalPage;
}
