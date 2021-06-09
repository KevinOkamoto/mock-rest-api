# Mock REST API

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

## Usage

To add an entry to the Mock REST API, perform a POST to `http://localhost:3000/_save_` with the following JSON body:

```json
{
    "key": "/user/123",
    "method": "GET",
    "body": {
        "id": "123",
        "name": "Abby Apple",
        "favoriteColor": "red"
    },
    "headers": { }
}
```

You can then retreive the `body` data at the URI: `http://localhost:3000/user/123`.

