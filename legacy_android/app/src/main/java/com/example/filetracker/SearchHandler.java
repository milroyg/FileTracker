package com.example.filetracker;

import android.os.AsyncTask;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class SearchHandler extends AsyncTask<String, Void, ArrayList<String[]>> {
    private static final String TAG = "SearchHandler";
    private OnSearchResultListener listener;

    public SearchHandler(OnSearchResultListener listener) {
        this.listener = listener;
    }

    @Override
    protected ArrayList<String[]> doInBackground(String... urls) {
        ArrayList<String[]> resultList = new ArrayList<>();
        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder()
                .url(urls[0])
                .build();

        try {
            Response response = client.newCall(request).execute();
            String responseData = response.body().string();
            Log.d(TAG, "Response: " + responseData);

            // Parse the JSON response and extract the necessary data
            if (urls[0].contains("searchcode")) {
                // Handle response when searching by code
                JSONObject jsonObject = new JSONObject(responseData);
                Iterator<String> keys = jsonObject.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    JSONObject innerObject = jsonObject.getJSONObject(key);
                    // Extract code from the inner object
                  //  String code = innerObject.getString("code");
                    String username = innerObject.getString("username");
                    String employee = innerObject.getString("employee");
                    String date = innerObject.getString("dt");
                    String[] result = {date,username,employee};
                    resultList.add(result);
                }
            } else if (urls[0].contains("searchfile")) {
                // Handle response when searching by filename
                JSONObject jsonObject = new JSONObject(responseData);
                Iterator<String> keys = jsonObject.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    JSONObject innerObject = jsonObject.getJSONObject(key);
                    String code = innerObject.getString("code");
                    String filename = innerObject.getString("filename");
                    String[] result = { filename,code};
                    resultList.add(result);
                }
            }

        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }

        return resultList;
    }









    @Override
    protected void onPostExecute(ArrayList<String[]> results) {
        if (results.isEmpty()) {
            // Inform the listener that no results were found
            listener.onNoResultsFound();
        } else {
            // Pass the results to the listener for display
            listener.onSearchResult(results);
        }
    }

    public interface OnSearchResultListener {
        void onSearchResult(ArrayList<String[]> results);
        void onNoResultsFound();
    }


}
