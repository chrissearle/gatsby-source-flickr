# gatsby-source-flickr

This source plugin for Gatsby will make images from [Flickr](https://flickr.com/) available in GraphQL queries.

## Derivation

This source plugin is **heavily** based on [Jason Lengstorf's](https://github.com/jlengstorf) [gatsby-source-pixabay](https://github.com/jlengstorf/gatsby-source-pixabay)

## Installation

```sh
# Install the plugin
yarn add gatsby-source-flickr
```

In `gatsby-config.js`:

```js
module.exports = {
  plugins: [
    {
      resolve: "gatsby-source-flickr",
      options: {
        api_key: "YOUR_FLICKR_API_KEY"
      }
    }
  ]
};
```

**NOTE:** To get a Flickr API key, [register for a Flickr account](https://www.flickr.com/signup). You will then need to create a [Flickr API app](https://www.flickr.com/services/apps/create/).

## Configuration Options

The configuration options for this plugin mirror the flickr method called. The default is flickr.photos.search - [Flickr photo search API call options](https://www.flickr.com/services/api/flickr.photos.search.html). The only **required** option is the `api_key`.

The plugin will add defaults for certain other fields:

| key            | default value                                                                                                                                                                                                                          | comment                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| method         | flickr.photos.search                                                                                                                                                                                                                   | the plugin expects the call to use the photo search api                           |
| extras         | description, license, date_upload, date_taken, owner_name, icon_server, original_format, last_update, geo, tags, machine_tags, o_dims, views, media, path_alias, url_sq, url_t, url_s, url_q, url_m, url_n, url_z, url_c, url_l, url_o | these are the fields (all the available ones as of the time of writing)           |
| per_page       | 500                                                                                                                                                                                                                                    | the number of photos per page (API call pagination) - 500 is the current maximum) |
| page           | 1                                                                                                                                                                                                                                      | the starting page                                                                 |
| format         | json                                                                                                                                                                                                                                   | the plugin expects json                                                           |
| nojsoncallback | 1                                                                                                                                                                                                                                      | the plugin expects json - if this is not set then flickr returns jsonp            |

### Example Configuration

This would retrieve all photos for a given user id.

```js
module.exports = {
  plugins: [
    {
      resolve: "gatsby-source-flickr",
      options: {
        api_key: process.env.FLICKR_API_KEY,
        user_id: process.env.FLICKR_USER_ID
      }
    }
  ]
};
```

### Other methods

The plugin can use any API method that returns as an object the following structure:

```json
{
  "KEY": {
    "photos": [],
    "page": 1,
    "pages": 3
  }
}
```

To do this - override the method option.

* You must provide any mandatory fields that the selected method requires.
* It currently understands KEY of either "photos" or "photoset" - this seems to cover most of the methods I've tested.
* It will pass the same defaults as above.

An example - get a user's album:

```js
    {
      resolve: 'gatsby-source-flickr',
      options: {
        api_key: process.env.FLICKR_API_KEY,
        user_id: process.env.FLICKR_USER_ID,
        method: 'flickr.photosets.getPhotos',
        photoset_id: NUMERIC_ALBUM_ID,
      },
    },
```

where NUMERIC_ALBUM_ID is the number taken from the album URL https://www.flickr.com/photos/USERNAME/albums/NUMERIC_ALBUM_ID


## Querying Flickr Images

Once the plugin is configured, two new queries are available in GraphQL: `allFlickrPhoto` and `flickrPhoto`.

Here’s an example query to load 10 images:

```gql
query PhotoQuery {
  allFlickrPhoto(limit: 10) {
    edges {
      node {
        id
        title
        description
        tags
        url_c
        width_c
        height_c
      }
    }
  }
}
```

## Limitations

The plugin was written to simply allow me to provide a source to my own flickr stream for my own site. It may or may not suit anyone else's needs :)
