
(function() {

var $application = document.getElementById('application');
var $$apiUrl = $application.dataset.apiUrl;
var $$baseUrl = $application.dataset.baseUrl;

var request = window.superagent;

function state() {
  var path = window.location.pathname.slice($$baseUrl.length);
  return {path: path};
}

function htmlFromTree(tree) {
  return tree.kind === 'folder'
    ? [
      "<li class='tree-node tree-folder' data-path='"+tree.path+"'>",
        "<b class='x-dir-rename-toggle-open' data-path='"+tree.path+"'>" + tree.name + "</b>",
        "<i class='x-create-toggle-open' data-path='"+tree.path+"'>&plus;</i>",
        "<ul>" + tree.children.map(htmlFromTree).join('') + "</ul>",
      "</li>"].join('')
    : [
      "<li class='tree-node tree-file' data-path='"+tree.path+"'>",
        "<a href='"+$$baseUrl+tree.path+"'>"+tree.name+"</a>",
      "</li>"].join('');
}

function getState(next) {
  var path = window.location.pathname.slice($$baseUrl.length);
  request.get($$apiUrl+'file/'+path, function(error, res) {
    if(!error) {
      var file = {
        path: path,
        content: res.body.content,
      };
      return next(null, {kind: 'file', file: file});
    }

    request.get($$apiUrl+'tree/', function(error, res) {
      if(error) return next(error);
      next(error, {kind: 'tree', tree: res.body.tree, path: path});
    });
  });
}

function hamburger() {
  return "<div class='burger'>" + [1,2,3].map(function(x) {
    return "<div class='burger-patty'></div>"
  }).join('') + "</div>";
}

function fileView(state) {
  var file = state.file;
  var parentPath = file.path.split('/').slice(0, -1).join('/') || '/';
  var fileName = file.path.split('/').slice(-1);
  return [
    "<div class='file-view'>", 
      "<header>",
        "<div class='file-location'>", 
          "<a href='"+$$baseUrl+"'>"+hamburger()+"</a>",
          "<div class='file-path'>",
            "<div class='file-name x-rename-open'>",
              "<h1>"+fileName+"</h1>",
              "<h2>"+file.path+"</h2>",
            "</div>",
            "<div class='file-actions'>",
              "<button class='x-delete button button-danger'>Delete</button>",
              "<button class='x-save button button-success'>Save File</button>",
            "</div>",
          "</div>",
          "<div class='move-path hidden'>",
            "<input id='move-path' class='textbox' type='text' value='"+file.path+"'/>",
            "<button class='x-rename-close button button-default'>Cancel</button>",
            "<button class='x-move button button-success'>Move File</button>",
          "</div>",
        "</div>",
        
      "</header>",
      "<textarea class='file-content'>"+file.content+"</textarea>",
    "</div>"
  ].join('');
}

$($application).on('click', '.x-rename-open', function(e) {
  var $name = $('.file-path').addClass('hidden');
  var $edit = $('.move-path').removeClass('hidden');
});

$($application).on('click', '.x-rename-close', function(e) {
  var $name = $('.file-path').removeClass('hidden');
  var $edit = $('.move-path').addClass('hidden');
});

$($application).on('click', '.x-save', function(e) {
  var content = $('.file-content').val();
  var $saveBtn = $(e.target);
  $saveBtn.attr('disabled', true);
  request
    .put($$apiUrl + 'file/' + state().path)
    .send({content: content})
    .end(function(error, res) {
      if(error) return flashError(error);
      $saveBtn.attr('disabled', false);
    });
});

$($application).on('click', '.x-delete', function(e) {
  $deleteBtn = $(e.target);
  $deleteBtn.attr('disabled', true);
  var path = state().path;
  request.del($$apiUrl + 'file/' + path, function(error, res) {
    if(error) return flashError(error);
    $deleteBtn.attr('disabled', false);
    window.location = $$baseUrl;
  });
});

$($application).on('click', '.x-move', function(e) {
  var newPath = $('.move-path .textbox').val();
  var oldPath = state().path;
  request
    .put($$apiUrl + 'file/' + oldPath)
    .send({rename: true, filepath: newPath})
    .end(function(error, res) {
      if(error) return flashError(error);
      window.location = $$baseUrl + newPath;
    });
});

function treeView(state) {
  return [
    "<div class='tree-view'>",
      "<header>",
        "<div class='tree-default'>",
          "<span class='x-happy-day build-status'></span>",
          "<div class='tree-actions'>",
            "<button class='x-build button button-success'>Build</button>",
          "</div>",
        "</div>",
        "<form class='tree-move hidden'>",
          "<input type='text' class='x-path textbox'/>",
          "<button class='x-cancel button button-default'>Cancel</button>",
          "<button class='x-folder-delete button button-danger'>Delete</button>",
          "<button class='x-folder-move button button-success'>Move folder</button>",
        "</form>",
        "<form class='tree-create hidden'>",
          "<input type='text' class='x-path textbox' placeholder='Create a file or folder, folders end with a slash \"/\"'/>",
          "<button class='x-cancel button button-default'>Cancel</button>",
          "<button class='x-create button button-success'>Create</button>",
        "</form>",
      "</header>",
      "<ul>"+htmlFromTree(state.tree)+"</ul>",
    "</div>"
  ].join('');
}

$($application).on('click', '.x-dir-rename-toggle-open', function(e) {
  var path = e.target.dataset.path;
  if(!path.length) return;
  $('.tree-default').addClass('hidden');
  $('.tree-move').removeClass('hidden');
  $('.tree-create').addClass('hidden');

  $('.x-path', '.tree-move')
    .val(path)
    .attr('data-initial', path)
    .focus();
});

$($application).on('submit', '.tree-move', function(e) {
  e.preventDefault();
  $('.x-folder-move', '.tree-move').click();
});

$($application).on('click', '.x-create-toggle-open', function(e) {
  $('.tree-default').addClass('hidden');
  $('.tree-move').addClass('hidden');
  $('.tree-create').removeClass('hidden');

  $('.x-path', '.tree-create')
    .val(e.target.dataset.path+'/')
    .focus();
});

$($application).on('click', '.x-cancel', function(e) {
  $('.tree-default').removeClass('hidden');
  $('.tree-move').addClass('hidden');
  $('.tree-create').addClass('hidden');
});

$($application).on('submit', '.tree-create', function(e) {
  e.preventDefault();
  $('.x-create', '.tree-create').click();
});

$($application).on('click', '.x-folder-delete', function(e) {
  var filepath = $('.x-path').attr('data-initial');
  request.del($$apiUrl + 'folder/' + filepath, function(error, res) {
    if(error) return flashError(error);
    window.location.reload();
  });
});

$($application).on('click', '.x-folder-move', function(e) {
  if(!e.which) return;
  var $textbox = $('.tree-move .textbox');
  var newPath = $textbox.val();
  var oldPath = $textbox.attr('data-initial');
  request
    .put($$apiUrl + 'folder/' + oldPath)
    .send({rename: true, filepath: newPath})
    .end(function(error, res) {
      if(error) return flashError(error);
      window.location = $$baseUrl;
    });
});

$($application).on('click', '.x-create', function(e) {
  var filepath = $('.x-path', '.tree-create').val();
  if(!filepath) {
    $('.tree-default').removeClass('hidden');
    $('.tree-create').addClass('hidden');
    return;
  }
  
  if(filepath.charAt(0) === '/') {
    filepath = filepath.slice(1);
  }

  var isDirectory = filepath.slice(-1) === '/';
  var route = isDirectory ? 'folder/' : 'file/';
  request
    .post($$apiUrl + route + filepath)
    .send({content: ''})
    .end(function(error, res) {
      if(error) return flashError(error);
      if(isDirectory) return window.location.reload();
      window.location = $$baseUrl + filepath;
    });
});

$($application).on('click', '.x-build', function(e) {
  request.post($$apiUrl + 'build', function(error, res) {
    if(error) return flashError(error);
    updateLastBuilt();
  });
});

function updateLastBuilt() {
  var d = new Date();
  var time = ['Hours', "Minutes", "Seconds"]
    .map(function(u) { return d['get'+u]();})
    .map(function(i) {
      if(i < 10) return '0' + i;
      return i;
    })
    .join(':');
  var text = "Last built at "+time+".";
  $('.build-status').text(text);
}

function initialize() {
  getState(function(error, state) {
    if(error) {
      var msg = "Application could not be loaded.";
      console.log('Failure state:', state);
      $application.innerHTML = msg;
      throw error;
    } else {
      var view = state.kind === 'file'
        ? fileView
        : treeView;
      $application.innerHTML = view(state);
      happyDay([$('.x-happy-day')[0]]);
    }
  });
}

initialize();

}).call(this);

