# mock-rest-api

## Set Up

The preferred method of starting this application is through Docker using `docker-compose`.

To start an instance of this application on your local machine (which has Docker running):
```
docker-compose up -d
```

This will start up the application container and a mogodb container. You should then be able to access the application at `http://localhost:3000`.

To stop the application, use the command:

```
docker-compose down
```
