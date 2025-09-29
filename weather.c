/*
    weather.c - Demonstration Ioto device agent weather app

    This app simulates getting the weather and temperature. It uses the api.open-meteo.com to get
    the temperature and weather code for a given city. It uses the geocoding-api.open-meteo.com API to
    get the latitude and longitude of the city.

    This file is linked with the Ioto device agent library. To keep it simple, this app has little error checking.
 */

#include "ioto.h"

static void changeCity(void *arg, Json *json);
static int getLatLon(cchar *city, double *lat, double *lon);
static void getWeather(cchar *city, double lat, double lon);

static char *city, *newCity;
static double lat = -1, lon = -1;

int main(int argc, char **argv)
{
    char  *argp;
    cchar *trace;
    int   argind;

    ioStartRuntime(0);

    trace = NULL;

    for (argind = 1; argind < argc; argind++) {
        argp = argv[argind];
        if (*argp != '-') {
            break;
        }
        if (smatch(argp, "--verbose") || smatch(argp, "-v")) {
            //  Run in verbose mode
            trace = "stdout:raw,error,info,trace,!debug:all";
        }
    }
    if (trace) {
        rSetLog(trace, 0, 1);
    }

    //  Run until instructed to stop
    ioRun(NULL);

    ioStopRuntime();
    return 0;
}

/*
    Run the demo. Loops updating the weather every 10 seconds
    Called when the device is connected to the cloud
 */
static void demo(void *arg)
{
    city = ioGet("city");
    if (!city || !*city) {
        //  Set a default city (in the cloud key/value store) if none is set by the UI yet
        city = sclone("Melbourne");
        ioSet("city", city);
    }
    //  Watch for changes to the city (from the UI)
    rWatch("db:sync:Store", (RWatchProc) changeCity, 0);

    for (int i = 0; i < 720 && ioConnected(); i++) {
        if (newCity && !smatch(newCity, city)) {
            rFree(city);
            city = sclone(newCity);
            rInfo("weather", "ChangeCity %s (lat %g lon %g)", city, lat, lon);
            lat = lon = -1;
        }
        if (lat < 0 || lon < 0) {
            getLatLon(city, &lat, &lon);
        }
        getWeather(city, lat, lon);
        rInfo("weather", "Sleeping for 10 seconds");
        rSleep(10 * TPS);
    }
}

/*
    Get the latitude and longitude of a city
 */
static int getLatLon(cchar *city, double *lat, double *lon)
{
    Json *response;
    char *url;

    url = sfmt("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1&language=en", city);
    response = urlGetJson(url, NULL);
    *lat = jsonGetDouble(response, 0, "results[0].latitude", 0);
    *lon = jsonGetDouble(response, 0, "results[0].longitude", 0);
    jsonFree(response);
    rFree(url);
    return 0;
}

/*
    Get the weather for a city
 */
static void getWeather(cchar *city, double lat, double lon)
{
    Json   *response;
    cchar  *outlook;
    char   *url, buf[32], key[256], metric[256];
    double temp;
    int    weatherCode;

    rInfo("weather", "GetWeather %s", city);
    url = sfmt(
        "https://api.open-meteo.com/v1/forecast?latitude=%.5f&longitude=%.5f&current=weather_code,temperature_2m", lat,
        lon);
    response = urlGetJson(url, NULL);
    
    temp = jsonGetDouble(response, 0, "current.temperature_2m", 0);
    weatherCode = jsonGetInt(response, 0, "current.weather_code", 0);
    jsonFree(response);

    if (weatherCode <= 1) {
        outlook = "sunny";
    } else if (weatherCode <= 3 || (weatherCode >= 45 && weatherCode <= 48)) {
        outlook = "cloudy";
    } else if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode == 85 || weatherCode == 86) {
        outlook = "snowing";
    } else if (weatherCode >= 95) {
        outlook = "stormy";
    } else if (weatherCode >= 51) {
        outlook = "raining";
    } else {
        outlook = "cloudy";
    }
    // Set the outlook in the cloud Store will be synced back locally
    rInfo("weather", "Set %s outlook: %s (%d)", city, outlook, weatherCode);
    SFMT(key, "/city/%s/outlook", city);
    ioSet(key, outlook);

    // Set a temperature metric (keeps history). The deviceId is set cloud-side.
    // ioSetMetric("/city/temp", temp, SFMT(dim, "[{\"deviceId\": true, \"city\": \"%s\"}]", city), 0);
    ioSetMetric(SFMT(metric, "/city/%s/temp", city), temp, "[{\"deviceId\": true}]", 0);
    rInfo("weather", "Set /city/%s/temp to %g", city, temp);

    rFree(url);
}

/*
    Watch for when the "city" is changed in the UI.
    Called when Store items change. 
 */
static void changeCity(void *arg, Json *json)
{
    cchar  *key, *value;

    key = jsonGet(json, 0, "key", 0);
    if (!smatch(key, "city")) {
        return;
    }
    value = jsonGet(json, 0, "value", 0);
    if (!value || !*value) {
        rInfo("weather", "Change city is null");
        return;
    }
    newCity = sclone(value);
}

/*
    Called by Ioto to start the demo
 */
PUBLIC int ioStart(void)
{
    ioOnConnect((RWatchProc) demo, 0, 0);
    return 0;
}

/*
    Called by Ioto to stop the demo
 */
PUBLIC void ioStop(void)
{
}
