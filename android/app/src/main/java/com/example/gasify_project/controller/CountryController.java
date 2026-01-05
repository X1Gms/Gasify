package com.example.gasify_project.controller;

import android.content.Context;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.CountriesResponse;
import com.example.gasify_project.model.SessionManager;

import retrofit2.Call;
import retrofit2.Callback;

public class CountryController {

    private final SessionManager session;
    private final ApiClient.ApiService apiService;

    // construtor que recebe um Context — cria internamente o SessionManager
    public CountryController(Context context, ApiClient.ApiService apiService){
        this.session = new SessionManager(context);
        this.apiService = apiService;
    }

    // Busca o token internamente e faz a chamada
    public void fetchCountries(Callback<CountriesResponse> callback) {
        // Ajusta este getter para o método real do teu SessionManager que devolve o token.
        // Exemplos comuns: getToken(), getAuthToken(), getAccessToken()
        String token = session.getToken(); // <-- se o teu método tiver outro nome, altera aqui

        if (token == null) token = "";

        Call<CountriesResponse> call = apiService.getCountries("Bearer " + token);
        call.enqueue(callback);
    }
}
