package com.example.filetracker;

public class SearchResult {
    private String code;
    private String filename;
    private String date;
    private String person;
    private String employee;

    // Constructor for search by code
    public SearchResult(String code, String date, String person,String employee) {
        this.code = code;
        this.date = date;
        this.person = person;
        this.employee=employee;
    }

    // Constructor for search by filename
    public SearchResult(String code, String filename) {
       // this.code = code;
        this.filename = filename;
    }

    // Getters for code, filename, date, and person employee
    public String getDate() {
        return date;
    }
//    public String getCode() {
//        return code;
//    }

    public String getFilename() {
        return filename;
    }



    public String getPerson() {
        return person;
    }

    public String getEmployee() {
        return employee;
    }

}
