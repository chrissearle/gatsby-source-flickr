import "core-js/stable";
import "regenerator-runtime/runtime";
import fetch from "node-fetch";
import queryString from "query-string";

exports.sourceNodes = async (
  { boundActionCreators: { createNode }, createNodeId, createContentDigest },
  { plugins, ...options }
) => {
  const sizes = ["sq", "t", "s", "q", "m", "n", "z,", "c", "l", "z"];

  // The flickr API has some issues when put into GraphQL - create a suitable version
  const fixPhoto = photo => {
    const fixed = photo;

    // Don't name crash with node.id
    fixed.photo_id = fixed.id;
    delete fixed.id;

    // Some fields can come down as either string or number. GraphQL doesn't like that. Force everything to number

    sizes.forEach(suffix => {
      if (fixed.hasOwnProperty(`height_${suffix}`)) {
        fixed[`height_${suffix}`] = parseInt(fixed[`height_${suffix}`]);
      }
      if (fixed.hasOwnProperty(`width_${suffix}`)) {
        fixed[`width_${suffix}`] = parseInt(fixed[`width_${suffix}`]);
      }
    });

    if (fixed.hasOwnProperty("accuracy")) {
      fixed.accuracy = parseInt(fixed.accuracy);
    }

    // A missing latitude or longitude can come down as either 0 or "0" - force to string

    if (fixed.hasOwnProperty("latitude")) {
      fixed.latitude = "" + fixed.latitude;
    }
    if (fixed.hasOwnProperty("longitude")) {
      fixed.longitude = "" + fixed.longitude;
    }

    // These can come down as either string or number. Have only ever seen "0" and 0 here - and documentation is sparse - remove them

    if (fixed.hasOwnProperty("datetakengranularity")) {
      delete fixed.datetakengranularity;
    }
    if (fixed.hasOwnProperty("datetakenunknown")) {
      delete fixed.datetakenunknown;
    }

    // Convert Date versions of dateupload and lastupdate

    if (fixed.hasOwnProperty("dateupload")) {
      fixed.dateupload_date = new Date(fixed.dateupload * 1000);
    }
    if (fixed.hasOwnProperty("lastupdate")) {
      fixed.lastupdate_date = new Date(fixed.lastupdate * 1000);
    }

    // Simplify the structure of the description to just a string

    if (fixed.hasOwnProperty("description")) {
      if (fixed.description.hasOwnProperty("_content")) {
        fixed.description = fixed.description._content;
      }
    }

    return fixed;
  };

  const unwrap = data => {
    if (data.hasOwnProperty("photoset")) {
      return data.photoset;
    }

    return data.photos;
  };

  const callFlickr = async options => {
    const url = `https://api.flickr.com/services/rest/?${queryString.stringify(
      options
    )}`;

    const response = await fetch(url);
    const data = await response.json();

    const photos = unwrap(data);

    photos.photo.forEach(raw => {
      const photo = fixPhoto(raw);

      createNode({
        ...photo,
        id: createNodeId(`flickr-photo-${photo.photo_id}`),
        parent: null,
        children: [],
        internal: {
          type: "FlickrPhoto",
          content: JSON.stringify(photo),
          contentDigest: createContentDigest(photo)
        }
      });
    });

    if (photos.page < photos.pages)
      await callFlickr({
        ...options,
        page: photos.page + 1
      });
  };

  await callFlickr({
    method: "flickr.photos.search",
    extras:
      "description, license, date_upload, date_taken, owner_name, icon_server, original_format, last_update, geo, tags, machine_tags, o_dims, views, media, path_alias, url_sq, url_t, url_s, url_q, url_m, url_n, url_z, url_c, url_l, url_o",
    per_page: 500,
    page: 1,
    format: "json",
    nojsoncallback: 1,
    ...options
  });
};
