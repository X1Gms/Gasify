package com.example.gasify_project.model.country;

import java.util.List;

// com.example.gasify_project.model.country.CountriesResponse
public class CountriesResponse {
    private boolean success;
    private List<Country> countries;

    public boolean isSuccess() { return success; }
    public List<Country> getCountries() { return countries; }

    public void setSuccess(boolean success) { this.success = success; }
    public void setCountries(List<Country> countries) { this.countries = countries; }
}
