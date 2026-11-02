package com.example.filetracker;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.AsyncTask;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;

public class DBHandler extends SQLiteOpenHelper {

    // Database constants
    private static final String DB_NAME = "FileTracker";
    private static final int DB_VERSION = 1;
    private static final String TABLE_NAME = "File";
    private static final String ID_COL = "id";
    private static final String EMPLOYEENAME_COL = "EmployeeName";
    private static final String DIVISION_COL = "Division";
    // Constants for the new table
    private static final String USER_TABLE_NAME = "Users";
    private static final String USERNAME_COL = "Username";


    // Constructor
    public DBHandler(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createTableQuery = "CREATE TABLE " + TABLE_NAME + " (" +
                ID_COL + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                EMPLOYEENAME_COL + " TEXT, " +
                DIVISION_COL + " TEXT)";
        db.execSQL(createTableQuery);

        // Create the user table
        String createUserTableQuery = "CREATE TABLE " + USER_TABLE_NAME + " (" +
                ID_COL + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                USERNAME_COL + " TEXT, " +
                DIVISION_COL + " TEXT)";
        db.execSQL(createUserTableQuery);
    }



    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_NAME);
        onCreate(db);
    }

    public ArrayList<String> getEmployeeByDivision(String division) {
        ArrayList<String> employeeList = new ArrayList<>();
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT EmployeeName FROM File WHERE Division = ?", new String[]{division});
        if (cursor.moveToFirst()) {
            do {
                String employeeName = cursor.getString(0);
                employeeList.add(employeeName);
            } while (cursor.moveToNext());
        }
        cursor.close();
        db.close();
        return employeeList;
    }



    // Method to insert data into the database
    // Method to insert a new employee record into the database
    public void insertData(String name, String division) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(EMPLOYEENAME_COL, name);
        values.put(DIVISION_COL, division);
        // Inserting Row
        db.insert(TABLE_NAME, null, values);
        // Closing database connection
        db.close();

    }

    // Method to insert data into the user table
    public void insertUserData(String username, String division) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(USERNAME_COL, username);
        values.put(DIVISION_COL, division);
        // Inserting Row
        db.insert(USER_TABLE_NAME, null, values);
        // Closing database connection
        db.close();
    }



    // AsyncTask to download CSV data from URL
    public void downloadCSVData(String url) {
        new DownloadCSVTask().execute(url);
    }

    public ArrayList<String> getEmployeesByDivision() {
        SQLiteDatabase db = this.getReadableDatabase();
        ArrayList<String> employeeList = new ArrayList<>();
        Cursor cursor = null;

        try {
            cursor = db.rawQuery("SELECT EmployeeName FROM File WHERE Division = ?", new String[]{DIVISION_COL});
            if (cursor != null && cursor.moveToFirst()) {
                do {
                    String employeeName = cursor.getString(0);
                    employeeList.add(employeeName);
                } while (cursor.moveToNext());
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return employeeList;
    }

    // AsyncTask to download CSV data
    private class DownloadCSVTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... urls) {
            StringBuilder resultBuilder = new StringBuilder();
            HttpURLConnection urlConnection = null;
            try {
                URL url = new URL(urls[0]);
                urlConnection = (HttpURLConnection) url.openConnection();
                InputStream inputStream = urlConnection.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                String line;
                while ((line = reader.readLine()) != null) {
                    resultBuilder.append(line).append("\n");
                }
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                if (urlConnection != null) {
                    urlConnection.disconnect();
                }
            }
            return resultBuilder.toString();
        }

        @Override
        protected void onPostExecute(String result) {
            if (!result.isEmpty()) {
                parseCSVAndStoreLocally(result);
            } else {
                // Handle case where CSV data is empty or download failed
                // You can display a toast or handle the error accordingly
                // For example:
                // Toast.makeText(context, "Failed to download CSV data", Toast.LENGTH_SHORT).show();
            }
        }
    }

    // Method to parse CSV data and store it locally in the database
    private void parseCSVAndStoreLocally(String csvData) {
        String[] lines = csvData.split("\n");
        SQLiteDatabase db = this.getWritableDatabase();
        for (String line : lines) {
            String[] parts = line.split(",");
            if (parts.length >= 2) {
                String column1Data = parts[1].trim();
                String column2Data = parts[0].trim();
                insertData(column1Data, column2Data);
            }
        }
        db.close();
    }
    public boolean isEmployeeExists(String employeeName, String division) {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = null;
        boolean result = false;

        try {
            // Query to check if the employee exists with the given name and division
            String query = "SELECT * FROM " + TABLE_NAME +
                    " WHERE " + EMPLOYEENAME_COL + " = ? AND " + DIVISION_COL + " = ?";
            cursor = db.rawQuery(query, new String[]{employeeName, division});

            // If the cursor has any rows, it means the employee exists
            if (cursor != null && cursor.moveToFirst()) {
                result = true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) {
                cursor.close();
            }
            db.close();
        }

        return result;
    }

    // Method to get all divisions from the database
    @SuppressLint("Range")
    public ArrayList<String> getDivisions() {
        ArrayList<String> divisionsList = new ArrayList<>();
        // Select All Query
        String selectQuery = "SELECT * FROM " + TABLE_NAME;
        SQLiteDatabase db = this.getWritableDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);

        // Loop through all rows and add division names to the list
        if (cursor.moveToFirst()) {
            do {
                divisionsList.add(cursor.getString(cursor.getColumnIndex(DIVISION_COL)));
            } while (cursor.moveToNext());
        }

        // Close cursor and database
        cursor.close();
        db.close();

        // Return divisions list
        return divisionsList;
    }

    // Method to get all Employee from the database
    @SuppressLint("Range")
    public ArrayList<String> getEmployee() {
        ArrayList<String> employeeList = new ArrayList<>();
        // Select All Query
        String selectQuery = "SELECT * FROM " + TABLE_NAME;
        SQLiteDatabase db = this.getWritableDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);

        // Loop through all rows and add division names to the list
        if (cursor.moveToFirst()) {
            do {
                employeeList.add(cursor.getString(cursor.getColumnIndex(EMPLOYEENAME_COL)));
            } while (cursor.moveToNext());
        }

        // Close cursor and database
        cursor.close();
        db.close();

        // Return divisions list
        return employeeList;
    }
    }



