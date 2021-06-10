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

# MongoDB

We are using mongodb, with specific settings to read DB files outside of this docker image from 
`./data `local folder.

To work directly with mongo db you can can switch to docker bash and connect to db:

```
docker exec -it mongo bash
mongo mongodb://mongo:27017/mockrestapi

```

Once you are in mongo shell , then you can use common mongo commands such as:

```
// retrive all records
db.responses.find() 


// remove all records
db.responses.remove({})

```
