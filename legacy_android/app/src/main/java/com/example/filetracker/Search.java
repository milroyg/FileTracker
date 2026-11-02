package com.example.filetracker;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.LayoutAnimationController;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.ArrayList;

public class Search extends AppCompatActivity implements View.OnClickListener, SearchHandler.OnSearchResultListener {
    private EditText searchEditText;
    private TableLayout resultsTable;
    // Declare a variable to store the selected file name
    private String selectedFileName;





    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_search);
//        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
//            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
//            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
//            return insets;
//        });
        searchEditText = findViewById(R.id.searchEditText);
        resultsTable = findViewById(R.id.resultsTable);

        findViewById(R.id.searchButton).setOnClickListener(this);
    }


    @Override
    public void onClick(View view) {
        if (view.getId() == R.id.searchButton) {
            // Get a reference to the search button
            Button searchButton = (Button) view;

            // Define the animation
            Animation anim = AnimationUtils.loadAnimation(getApplicationContext(), R.anim.loading_animation);

            // Apply the animation to the search button
            searchButton.startAnimation(anim);
            String query = searchEditText.getText().toString().trim();
            // Check if the query is empty
            if (!query.isEmpty()) {
                // Check if the query contains both numeric and alphabetic characters
                if (containsAlphaNumeric(query)) {
                    // Redirect to url4 for queries containing both numeric and alphabetic characters
                    searchByCode(query);
                } else {
                    // Check if the query is numeric (code) or not (filename)
                    if (isNumeric(query)) {
                        // Redirect to url4 for numeric queries
                        searchByCode(query);
                    } else {
                        // Redirect to url5 for filename queries
                        searchByFileName(query);
                    }
                }
            } else {
                // Handle case when search query is empty
                Toast.makeText(this, "Please enter a search query", Toast.LENGTH_SHORT).show();
            }
        } else {
            // Handle empty query case if needed
        }
    }




    // Helper method to check if a string is numeric
    private boolean isNumeric(String str) {
        return str.matches("-?\\d+(\\.\\d+)?");
    }

    // Helper method to check if a string contains alphanumeric characters
    private boolean containsAlphaNumeric(String str) {
        return str.matches(".*[a-zA-Z].*") && str.matches(".*\\d.*");
    }

    private void searchByCode(String code) {
        String url = "https://goawrd.gov.in/file-tracker/searchcode?code=" + code;
        new SearchHandler(this).execute(url);
    }

    private void searchByFileName(String fileName) {
        String url = "https://goawrd.gov.in/file-tracker/searchfile?filename=" + fileName;
        new SearchHandler(this).execute(url);
    }


    // Method to store selected file name
    private void setSelectedFileName(String fileName) {
        this.selectedFileName = fileName;
    }

    // Method to retrieve stored file name
    private String getSelectedFileName() {
        return selectedFileName;
    }

    @Override
    public void onSearchResult(ArrayList<String[]> results) {
        // Determine whether the search was performed by code or filename
        boolean isSearchByCode = !results.isEmpty() && results.get(0).length == 3;

        // Call displayResults method with the appropriate boolean flag
        displayResults(results, isSearchByCode);
    }

    // Method from OnSearchResultListener interface to handle case when no results are found
    @Override
    public void onNoResultsFound() {
        // Inform the user that no results were found
        Toast.makeText(this, "No results found for the given code or filename", Toast.LENGTH_SHORT).show();
    }


    //--------------------------------------------------------------------------------------------//

    private void displayResults(final ArrayList<String[]> results, final boolean searchByCode) {
        resultsTable.removeAllViews();
        // Define table headers based on the search type
        String[] headers;
        if (searchByCode) {
          //  headers = new String[]{"Date Inward & Marked to:"};
            headers = new String[]{ "Date", "Inward", "Marked to"};

        } else {
            headers = new String[]{"Filename"};
        }
//        // Add new header above existing headers if searchByCode is true
//        if (searchByCode) {
//            TableRow additionalHeaderRow = new TableRow(this);
//            additionalHeaderRow.setLayoutParams(new TableRow.LayoutParams(TableRow.LayoutParams.MATCH_PARENT, TableRow.LayoutParams.WRAP_CONTENT));
//
//            TextView additionalHeaderTextView = new TextView(this);
//            additionalHeaderTextView.setText("Date Inward & Marked to:");
//            additionalHeaderTextView.setPadding(20, 20, 20, 20);
//            additionalHeaderTextView.setTextColor(Color.WHITE);
//            additionalHeaderTextView.setBackgroundColor(Color.parseColor("#854aef"));
//            additionalHeaderTextView.setLayoutParams(new TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
//            additionalHeaderTextView.setGravity(Gravity.CENTER);
//
//            additionalHeaderRow.addView(additionalHeaderTextView);
//            resultsTable.addView(additionalHeaderRow);
//        }
        // Create and add table header row
        TableRow headerRow = new TableRow(this);
        headerRow.setLayoutParams(new TableRow.LayoutParams(TableRow.LayoutParams.MATCH_PARENT, TableRow.LayoutParams.WRAP_CONTENT));



        for (String header : headers) {

                TextView headerTextView = new TextView(this);
                headerTextView.setText(header);
                headerTextView.setPadding(20, 20, 20, 20);
                headerTextView.setTextColor(Color.WHITE);
                headerTextView.setBackgroundColor(Color.parseColor("#4c73fd")); // Set light grey background color
                headerTextView.setLayoutParams(new TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1)); // Set layout weight to evenly distribute columns
                headerTextView.setGravity(Gravity.CENTER); // Center text in the header cell
                headerRow.addView(headerTextView);
            }

        resultsTable.addView(headerRow);



        // Add results data rows based on the search type
        if (searchByCode) {
            for (final String[] result : results) {
                TableRow row = new TableRow(this);
                TableRow.LayoutParams layoutParams = new TableRow.LayoutParams(TableRow.LayoutParams.MATCH_PARENT, TableRow.LayoutParams.WRAP_CONTENT);
                row.setLayoutParams(layoutParams);

                for (int i = 0; i < result.length; i++) {
                    TextView textView = new TextView(this);
                    textView.setText(result[i]);
                    textView.setPadding(20, 20, 20, 20);
                    textView.setLayoutParams(new TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1)); // Set layout weight to evenly distribute columns
                    textView.setGravity(Gravity.CENTER); // Center text in the data cell
                    row.setBackground(ContextCompat.getDrawable(this, R.drawable.table_background));
                    row.addView(textView);
                }
                resultsTable.addView(row);
            }
        } else {
            for (final String[] result : results) {
                TableRow row = new TableRow(this);
                TableRow.LayoutParams layoutParams = new TableRow.LayoutParams(TableRow.LayoutParams.MATCH_PARENT, TableRow.LayoutParams.WRAP_CONTENT);
                row.setLayoutParams(layoutParams);

                // Set OnClickListener for each TableRow
                row.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (!searchByCode) {

                            // If searching by filename, perform search by code using the first column value (assuming it's the code)
                            String fileName = result[0];
                            setSelectedFileName(fileName);// Store the selected file name
                            // If searching by filename, perform search by code using the first column value (assuming it's the code)
                            String query = result[1];
                            searchByCode(query);

                        }
                    }
                });


                    TextView textView = new TextView(this);
                    textView.setText(result[0]);
                    textView.setPadding(20, 20, 20, 20);
                    textView.setLayoutParams(new TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1)); // Set layout weight to evenly distribute columns
                    textView.setGravity(Gravity.CENTER); // Center text in the data cell
                    row.setBackground(ContextCompat.getDrawable(this, R.drawable.table_background));
                    row.addView(textView);

                // Add animation to the row
                Animation tableAnimation = AnimationUtils.loadAnimation(getApplicationContext(), R.anim.table_row_animation);
                row.startAnimation(tableAnimation);

                resultsTable.addView(row);
            }
        }
        // Apply layout animation to the table
        LayoutAnimationController animationController = AnimationUtils.loadLayoutAnimation(this, R.anim.table_layout_animation);
        resultsTable.setLayoutAnimation(animationController);
        resultsTable.scheduleLayoutAnimation();
    }
    @Override
    public void onBackPressed() {
        if (getSelectedFileName() != null) {
            // If a file name is stored, show results based on that file name
            searchByFileName(getSelectedFileName());
            setSelectedFileName(null); // Clear stored file name after use
        } else {
            super.onBackPressed(); // If no file name is stored, proceed with default back navigation
        }
    }


}
