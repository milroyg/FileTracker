package com.example.filetracker;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class CSVReader {

    // Method to fetch data from the CSV file online
    public static List<String> fetchEmployeeListFromCSV() {
        List<String> employeeList = new ArrayList<>();

        try {
            // URL of the CSV file
            URL url = new URL("https://docs.google.com/spreadsheets/d/e/2PACX-1vRnjsCiY_MV7PBvE8qkUjSqSuFrfyAQlpuoDbJ2WsItmd4LmswTjsTkFc-GQ6z2-Uluqn4fOC299enn/pub?gid=1956630541&single=true&output=csv");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                // Assuming CSV format is: EmployeeName,Office
                String[] parts = line.split(",");
                if (parts.length >= 2) {
                    // Assuming employee name is before comma and office is after comma
                    String employeeName = parts[0].trim();
                    String office = parts[1].trim();
                    // Adding employee name and office to the list
                    employeeList.add(employeeName + ", " + office);
                }
            }
            reader.close();
            connection.disconnect();
        } catch (IOException e) {
            e.printStackTrace();
            // Handle exception appropriately
        }

        return employeeList;
    }

    public static void main(String[] args) {
        // Example usage
        List<String> employees = fetchEmployeeListFromCSV();
        for (String employee : employees) {
            System.out.println(employee);
        }
    }
}
