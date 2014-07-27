var Pinboard = function(settings) {
  var module = {};

   var bookmarkUrl = function(tags,callback) {
    
    settings.getAuthToken(function(authToken) {
      var tagQuery = "tag="+tags.join(",");
      callback("https://api.pinboard.in/v1/posts/all?auth_token="+authToken+"&format=json&"+tagQuery);
    });
  }

  module.getBookmarksForTags = function(tags,callback) {
    bookmarkUrl(tags,function(url) {
      $.getJSON(url,function(data) {
        var bookmarks = data.map(function(entry) {
          return {
            url: entry.href,
            title: entry.description
          }
        });

        callback(bookmarks);
      });
    });
  };
  return module;
};

var Bookmarks = function() {
  var module = {};
  var BOOKMARKS_BAR_ID = "1";
  var createBookmarkFolder = function(folderName,callback) {
    chrome.bookmarks.search({
      title: folderName
    },function(results) {
      var existingFolders = results.filter(function(result) {
        return result.parentId === BOOKMARKS_BAR_ID && result.url === undefined;
      });

      if (existingFolders.length === 0) {
        chrome.bookmarks.create({'parentId': BOOKMARKS_BAR_ID,
                               'title': folderName},
                              function(newFolder) {
          console.log("added folder: " + newFolder.title);
          callback(newFolder);
        });  
      } else {
        callback(existingFolders[0]);
        console.log("Folder "+folderName+" already existed");
      }
      
    });
      
  };

  var createBookmark = function(parentNode, bookmark) {
    var children = chrome.bookmarks.getChildren(parentNode.id,function(children) {
      var existingBookmarksWithSameUrl = children.filter(function(child) {
        return child.url.indexOf(bookmark.url)!=-1 && Math.abs(child.url.length - bookmark.url.length) <=1; // hacky way to check for equal but tolerating trailing / that chrome mitght put in
      });

      if (existingBookmarksWithSameUrl.length === 0) {
        chrome.bookmarks.create({
            title: bookmark.title,
            url: bookmark.url, 
            parentId: parentNode.id
        },function() {
          console.log("Added",bookmark);
        });
      } else {
        console.log("Bookmark for URL "+bookmark.url+" already exists");
      }
    });
    
  }


  module.setBookmarks = function(folderName, bookmarks) {
    createBookmarkFolder(folderName,function(folderNode) {
      bookmarks.forEach(function(bookmark) {
        createBookmark(folderNode,bookmark);
      })
    })
  };

  

  return module;
}

var Settings = function() {
  // can we find a more secure way of storing those credentials?
  var module = {}
  module.getAuthToken = function(callback) {
    chrome.storage.local.get("auth_token",function(result) {
      callback(result.auth_token)
    });
  }

  module.setAuthToken = function(token) {
    chrome.storage.local.set({'auth_token':token});
  }
  return module;
}