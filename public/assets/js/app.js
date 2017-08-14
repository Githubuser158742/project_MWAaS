//globals
var app = {
  page: "all",
  activeTab: null,
  reload: null
};

$(function() {

  //JSON inladen van externe locatie en lokaal opslaan
  app.loadJSON = function() {
    var request = new Request('http://localhost:3000/assets/data/recipes.json', {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      cache: 'no-cache',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });

    fetch(request).then(function(response) {
      if (response.ok) {
        //update wnr data correct is
        return response.json();
      } else {
        //laden van lokale storage
        app.loadData();
        if (app.reload == 1) {
          alert("Er kon geen verbinding gemaakt worden met de database!");
          app.reload = 0;
        }
      }
    }).then(function(jsondata) {
      app.updateDB(jsondata);
      if (app.reload == 1) {
        alert("Database updated!");
        app.reload = 0;
      }
    }).catch(function(error) {
      //data inladen van lokale/indexedDB storage
      app.loadData();
      if (app.reload == 1) {
        alert("Er kon geen data weggeschreven worden!");
        app.reload = 0;
      }
    });
  };

  //Lokale database updaten
  app.updateDB = function(jsonData) {
    var store = localforage.createInstance({
      name: "recipe_store"
    });

    // ==> localforage
    var jsonrecipes = jsonData.recipes;
    var recipe = {};
    var recipes = [];
    jsonrecipes.forEach(function(jsonrecipe) {
      recipe = {};
      //velden invullen
      recipe.id = jsonrecipe.id;
      recipe.description = jsonrecipe.description;
      recipe.chef = jsonrecipe.chef;
      recipe.category = jsonrecipe.category;
      recipe.added = jsonrecipe.added;
      recipe.steps = jsonrecipe.steps;
      //toevoegen aan array
      recipes.push(recipe);
    });
    store.setItem('recipes', JSON.stringify(recipes));
    app.loadData();
  };

  app.updateCustomDB = function(jsonData) {
    //indexedDB heeft voorkeur, indien nodig mogelijk ==> localstorage
    var store = localforage.createInstance({
      name: "recipe_store"
    });

    store.setItem('customvalues', JSON.stringify(app.customvalues));
  };

  //Lokale storage inladen
  app.loadData = function() {
    //console.log("loadData");
    var store = localforage.createInstance({
      name: "recipe_store"
    });

    //inladen van localforage
    store.getItem('recipes').then(function(value) {
      app.recipes = JSON.parse(value);
      store.getItem('customvalues').then(function(value) {
        app.customvalues = [];
        if ((JSON.parse(value) !== null) && (JSON.parse(value) !== undefined)) {
          $.each(JSON.parse(value), function(key, item) {
            if ((item !== null) && (item !== undefined)) {
              app.customvalues[item.recipe_id] = item;
            }
          });
        }
        app.showData();
      });
    });
  };

  //correcte pagina opbouwen op basis van variabele
  app.showData = function() {
    if ($("#pageone").is(".ui.page-active")) {
      app.page = "all";
    }
    if ($("#pagetwo").is(".ui-page-active")) {
      app.page = "saved";
    }
    if ($("#pagethree").is(".ui-page-active")) {
      app.page = "rated";
    }

    switch (app.page) {
      case "all":
        $("#btnOne").trigger("buildpage");
        break;
      case "saved":
        $("#btnTwo").trigger("buildpage");
        break;
      case "rated":
        $("#btnThree").trigger("buildpage");
        break;
      default:
        break;
    }
  };

  // sorteren op 'id'
  app.sortById = function(a, b) {
    var aId = parseInt(a.id);
    var bId = parseInt(b.id);
    return aId < bId ?
      -1 :
      ((aId > bId) ?
        1 :
        0);
  };

  //recepten tonen op basis van actief tabblad
  app.showRecipes = function(pagetype) {
    //console.log(app.activeTab);
    var id = null;
    switch (pagetype) {
      case 1:
        id = app.activeTab;
        break;
      case 2:
        id = app.activeTab + "Saved";
        break;
      case 3:
        id = app.activeTab + "Rated";
        break;
      default:
        id = app.activeTab;
        break;
    }

    $("#" + id).html("");
    var counter = 1;

    //default sorteren (indien nodig nog nieuwe sorteermethodes voorzien)
    switch (app.activeTab) {
      case "meat":
        app.recipes.sort(app.sortById);
        break;
      case "fish":
        app.recipes.sort(app.sortById);
        break;
      case "veggie":
        app.recipes.sort(app.sortById);
        break;
      default:
        break;
    }

    if(app.recipes == null){
      var element = "Gelieve een categorie te kiezen.";
      $("#" + id).append(element);
    }
    //console.log(app.recipes);
    $.each(app.recipes, function(key, recipe) {
      var showAllElements = false;
      var showSavedElements = false;
      var showRatedElements = false;
      var score = '';
      var comment = '';

      if (recipe.category == app.activeTab) {
        //showElement = true;
        if (pagetype == 1) {
          showAllElements = true;
          if ((app.customvalues[recipe.id] !== null) && (app.customvalues[recipe.id] !== undefined) && app.customvalues[recipe.id].saved == true) {
            showAllElements = false;
          }
        }
        if ((app.customvalues[recipe.id] !== null) && (app.customvalues[recipe.id] !== undefined)) {
          if (app.customvalues[recipe.id].score !== null) {
            score = escapeHTML(app.customvalues[recipe.id].score);
          }
          if (app.customvalues[recipe.id].comment !== null) {
            comment = escapeHTML(app.customvalues[recipe.id].comment);
          }
          if (app.customvalues[recipe.id].saved !== null && pagetype == 2) {
            showSavedElements = true;
          } else if (app.customvalues[recipe.id].saved !== null && pagetype == 3 && ((score !== '') || (comment !== ''))) {
            showRatedElements = true;
          }
        }
      }

      //escape HTML (XSS filter)
      var uniqueid = escapeHTML(recipe.id.toString())
      var description = escapeHTML(recipe.description.toString())
      var chef = escapeHTML(recipe.chef.toString())
      var added = escapeHTML(recipe.added.toString())
      var steps = escapeHTML(recipe.steps.toString())

      if (showAllElements) {
        var element = ([
          "<div class='ui-bar ui-bar-b'>",
              "<div class='ui-grid-a'><center>",
              "<input class='checkboxrecipe' id='checkBox" + uniqueid + "' data-recipe='" + uniqueid + "' type='checkbox'>" + description + "</center></div>",
              "<div class='ui-grid-a'>",
                "<div class='ui-block-a'><center>" + chef + "</center></div>",
                "<div class='ui-block-b'><center>" + added + "</center></div>",
              "</div>",
                "<center><div data-role='collapsible' id='" + id + "' class='ui-collapsible ui-collapsible-inset ui-corner-all ui-collapsible-themed-content'>",
                  "<h4 class='ui-collapsible-heading'>Stappenplan</h4>",
                      "<p>" + steps + "</p>",
              "</center></div>",
          "</div>"
        ].join(" "));
        $("#" + id).append(element);
        //trigger oproepen om effectief de juiste css op de elementen te krijgen
        $("#" + id).trigger("create");
      }

      if (showSavedElements) {
        var element = ([
          "<div class='ui-bar ui-bar-b'>",
            "<div class='ui-grid-a'>",
              "<center>" + description + "</center>",
            "</div>",
            "<div class='ui-grid-a'>",
              "<div class='ui-block-a'>",
                "<center>" + chef + "</center>",
              "</div>",
              "<div class='ui-block-b'>",
                "<center>" + added + "</center>",
              "</div>",
            "</div>",
          "<div data-role='collapsible' id='" + id + "' class='ui-collapsible ui-collapsible-inset ui-corner-all ui-collapsible-themed-content'>",
              "<h4 class='ui-collapsible-heading'>Stappenplan</h4>",
                  "<p>" + steps + "</p>",
          "</div>",
          "<div data-role='fieldcontain'>",
          "<div class='ui-grid-a'>",
          "<div class='ui-block-a'>",
          "<label for='scorerecipe' class='select'>Score op 10:</label>",
          "<select class='scorerecipe' id='" + app.activeTab + "scorerecipe" + recipe.id.toString() + "' data-recipe='" + recipe.id.toString() + "'>",
          "<option value=''" + (score.toString() == '' ?
            'selected' :
            '') + ">--</option>",
          "<option value='10'" + (score.toString() == '10' ?
            'selected' :
            '') + ">10</option>",
          "<option value='8'" + (score.toString() == '8' ?
            'selected' :
            '') + ">8</option>",
          "<option value='7'" + (score.toString() == '7' ?
            'selected' :
            '') + ">7</option>",
          "<option value='6'" + (score.toString() == '6' ?
            'selected' :
            '') + ">6</option>",
          "<option value='5'" + (score.toString() == '5' ?
            'selected' :
            '') + ">5</option>",
          "<option value='4'" + (score.toString() == '4' ?
            'selected' :
            '') + ">4</option>",
          "<option value='3'" + (score.toString() == '3' ?
            'selected' :
            '') + ">3</option>",
          "<option value='2'" + (score.toString() == '2' ?
            'selected' :
            '') + ">2</option>",
          "<option value='1'" + (score.toString() == '1' ?
            'selected' :
            '') + ">1</option>",
          "<option value='0'" + (score.toString() == '0' ?
            'selected' :
            '') + ">0</option>",
          "</select>",
          "</div>",
          "<div class='ui-block-b'>",
          "<label for='commentrecipe' class='input'>Opmerking:</label>",
          "<textarea class='commentrecipe' id='" + app.activeTab + "commentrecipe" + recipe.id.toString() + "' data-recipe='" + recipe.id.toString() + "' maxlength='150' rows='2'>" + comment.toString() + "</textarea>",
          "</div>",
          "</div>",
          "</div>",
          "<div>"
        ].join(" "));
        $("#" + id).append(element);
        $("#" + id).trigger("create");
        counter++;
      }

      if (showRatedElements) {
        var element = ([
          "<div class='ui-bar ui-bar-b'>",
          "<div class='ui-grid-a'>",
            description,
          "</div>",
          "<div class='ui-grid-a'>",
          "<div class='ui-block-a'>",
            chef,
          "</div>",
          "<div class='ui-block-b'>",
            added,
          "</div>",
          "</div>",
          "<div class='ui-grid-a'>",
          "<div class='ui-block-a'>",
          "Score: " + score.toString(),
          "</div>",
          "<div class='ui-block-b'>",
          "Commentaar: " + comment.toString(),
          "</div>",
          "</div>",
          "<div data-role='collapsible' id='" + id + "' class='ui-collapsible ui-collapsible-inset ui-corner-all ui-collapsible-themed-content'>",
              "<h4 class='ui-collapsible-heading'>Stappenplan</h4>",
                  "<p>" + steps + "</p>",
          "</div>",
          "</div>"
        ].join(" "));
        $("#" + id).append(element);
        $("#" + id).trigger("create");
      }
    });
  };

  //eerste pagina ==> code wordt niet altijd bereikt wnr knop wordt aangeklikt
  $("#btnOne").on('click buildpage', function(event) {
    app.activeTab = "meat";
    $("#pageMeat").addClass("ui-btn-active");
    app.showRecipes(1);
  });

  //tab: meat
  $("#pageMeat").on('click', function(event) {
    app.activeTab = "meat";
    app.showRecipes(1);
  });

  //tab: fish
  $("#pageFish").on('click', function(event) {
    app.activeTab = "fish";
    app.showRecipes(1);
  });

  //tab: veggie
  $("#pageVeggie").on('click', function(event) {
    app.activeTab = "veggie";
    app.showRecipes(1);
  });

  // 'checkBox" + recipe.id.toString()
  $(document).on("change", function(event) {
    var checked = $('#' + event.target.id + ':checkbox:checked').length > 0;
    var recipeid = parseInt($('#' + event.target.id).data("recipe"));

    if (recipeid && (checked !== null) && (checked !== undefined)) {
      if ((app.customvalues[recipeid] === null) || (app.customvalues[recipeid] === undefined)) {
        app.customvalues[recipeid] = {
          recipe_id: recipeid,
          saved: checked,
          score: null,
          comment: null
        };
      } else {
        app.customvalues[recipeid].saved = checked;
      }
      alert("Het recept is opgeslagen!");
      app.updateCustomDB();
    }
  });

  $(document).on("change", function(event) {
    var value = $('#' + event.target.id + ' option:selected').val();
    //var checked = true;
    var recipeid = parseInt($('#' + event.target.id).data("recipe"));

    if (recipeid && (value !== null) && (value !== undefined)) {
      if ((app.customvalues[recipeid] === null) || (app.customvalues[recipeid] === undefined)) {
        app.customvalues[recipeid] = {
          recipe_id: recipeid,
          //saved: checked,
          score: value,
          comment: null
        };
      } else {
        app.customvalues[recipeid].score = value;
      }
      app.updateCustomDB();
    }
  });

  $(document).on("keyup", function(event) {
    var value = $('#' + event.target.id).val();
    value = escapeHTML(value);
    //var checked = true;
    var recipeid = parseInt($('#' + event.target.id).data("recipe"));

    if ((recipeid !== null) && (recipeid !== undefined) && (recipeid !== NaN) && (value !== null) && (value !== undefined)) {

      if ((app.customvalues[recipeid] === null) || (app.customvalues[recipeid] === undefined)) {
        app.customvalues[recipeid] = {
          recipe_id: recipeid,
          //saved: checked,
          score: null,
          comment: value
        };
      } else {
        //console.log("Changed value: " + value);
        app.customvalues[recipeid].comment = value;
      }

      app.updateCustomDB();
    }
  });

  //tweede pagina ==> code wordt niet altijd bereikt wnr knop wordt aangeklikt
  $("#btnTwo").on('click buildpage', function(event) {
    app.page = "saved";
    app.activeTab = "meat";
    $("#pageMeatSaved").addClass("ui-btn-active");
    app.showRecipes(2);
    //indien er op de knop wordt geklikt wordt er wel data ingeladen
    //wanneer trigger hier wordt opgeroepen ==> geen resultaat
    //$("pageMeatSaved").trigger("click");
  });

  //tab: meat
  $("#pageMeatSaved").on('click', function(event) {
    app.activeTab = "meat";
    app.showRecipes(2);
  });

  //tab: fish
  $("#pageFishSaved").on('click', function(event) {
    app.activeTab = "fish";
    app.showRecipes(2);
  });

  //tab: veggie
  $("#pageVeggieSaved").on('click', function(event) {
    app.activeTab = "veggie";
    app.showRecipes(2);
  });

  //Derde pagina ==> code wordt niet altijd bereikt wnr knop wordt aangeklikt
  $("#btnThree").on('click buildpage', function(event) {
    app.page = "rated";
    app.activeTab = "meat";
    $("#pageMeatRated").addClass("ui-btn-active");
    app.showRecipes(3);
    //indien er op de knop wordt geklikt wordt er wel data ingeladen
    //wanneer trigger hier wordt opgeroepen ==> geen resultaat
    //$("pageMeatRated").trigger("click");
  });

  //tab: meat
  $("#pageMeatRated").on('click', function(event) {
    app.activeTab = "meat";
    app.showRecipes(3);
  });

  //tab: fish
  $("#pageFishRated").on('click', function(event) {
    app.activeTab = "fish";
    app.showRecipes(3);
  });

  //tab: veggie
  $("#pageVeggieRated").on('click', function(event) {
    app.activeTab = "veggie";
    app.showRecipes(3);
  });

  //refresh de pagina - 3 refreshes nodig
  //2 andere pagina's refreshbtns werken niet wanneer
  //de eerste pagina wordt opgeroepen
  $("#btnRefresh").on('click', function(event) {
      location.reload();
	});
  $("#btnRefresh2").on('click', function(event) {
      location.reload();
  });
  $("#btnRefresh3").on('click', function(event) {
      location.reload();
  });


  //serviceworker registreren voor caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function() {
    });
  }

  //Bad practice - blacklist
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHTML(string){
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
    });
  }

  //let the games begin
  app.loadJSON();
});
