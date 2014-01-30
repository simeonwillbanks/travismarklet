(function ($) {
  var travismarklet = window._travismarklet;
  travismarklet.travis = {};
  travismarklet.gitHub = {};

  function getGitHubUrls(pullRequest) {
    return {
      api: "https://api.github.com/repos/"+pullRequest.repo.owner+"/"+pullRequest.repo.name+"/pulls/"+pullRequest.id
    };
  };

  function getTravisApiUrl(pullRequest) {
    return "https://api.travis-ci.org/repos/"+pullRequest.repo.owner+"/"+pullRequest.repo.name+"/builds";
  };

  function getTravisBuildUrl(pullRequest, build) {
    return "https://travis-ci.org/"+pullRequest.repo.owner+"/"+pullRequest.repo.name+"/builds/"+build.id;
  };

  function getGitHubPullRequest() {
    var pathParts = window.location.pathname.split("/");
    return {
      repo: {
        owner: pathParts[1],
        name: pathParts[2]
      },
      id: pathParts[4]
    };
  };

  function getUiBgColor(travis) {
    var color = "black";
    if (travis) {
      switch(travis.build.state) {
        case "created":
        case "queued":
        case "started":
          color = "yellow";
          break;
        case "passed":
        case "ready":
          color = "green";
          break;
        case "errored":
        case "canceled":
        case "failed":
          color = "red";
          break;
      };
    }
    return color;
  };

  function updateUi(ui, options) {
    var travis = options.travis,
        networkError = options.networkError,
        divBgColor = getUiBgColor(travis);

    ui.$div.css("background-color", divBgColor);
    if (networkError) {
      ui.$a.text("travismarklet failed. Please try again!");
      ui.$a.attr("href", "#");
    } else {
      ui.$a.text("Travis CI build "+travis.build.state+".");
      ui.$a.attr("href", travis.urls.build);
    };
  };

  function createUi(ui) {
    var divId = "travismarklet",
        divBgColor = getUiBgColor();

    if (!ui) {
      ui = {};
      $("body").append(
        $("<div id='"+divId+"'><a href='#'/></div>").css({
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          display: "none",
          padding: "1em",
          fontWeight: "bold",
          fontSize: "1em",
          zIndex: 1000
        })
      );
      ui.$div = $("#"+divId);
      ui.$a = ui.$div.children("a").css({
        color: "black",
        backgroundColor: "white",
        padding: "0.5em"
      });
    };

    ui.$div.css("background-color", divBgColor);
    ui.$a.text("travismarklet getting Travis CI build status.");
    ui.$div.show();
    return ui;
  };

  function getTravisBuildStatus(ui, gitHub, travis) {
    $.ajax({
        dataType: "json",
        url: travis.urls.api,
        headers: { "Accept": "application/json; version=2" }
      })
      .done(function(builds) {
        $.each(builds["commits"], function(i, commit) {
          if (commit.sha === gitHub.mergeCommitSha) {
            travis.commitId = commit.id;
            return false;
          }
        });

        $.each(builds["builds"], function(i, build) {
          if (build.commit_id === travis.commitId) {
            travis.build = build;
            travis.urls.build = getTravisBuildUrl(gitHub.pullRequest, travis.build);
            return false;
          }
        });
      })
      .fail(function() {
        updateUi(ui, {networkError: true});
      })
      .always(function() {
        updateUi(ui, {travis: travis});
      });
  };

  function getGitHubMergeCommitSha(ui, gitHub, travis) {
    $.ajax({
        dataType: "json",
        url: gitHub.urls.api,
        headers: { "Accept": "application/vnd.github.v3+json" }
      })
      .done(function(pullRequest) {
        gitHub.mergeCommitSha = pullRequest.merge_commit_sha;
        getTravisBuildStatus(ui, gitHub, travis);
      })
      .fail(function() {
        updateUi(ui, {networkError: true});
      });
  };

  travismarklet.init = function () {
    var TM = travismarklet;

    TM.gitHub.pullRequest = (TM.gitHub.pullRequest || getGitHubPullRequest());
    TM.gitHub.urls = (TM.gitHub.urls || getGitHubUrls(TM.gitHub.pullRequest));

    TM.travis.urls = (TM.travis.urls || {});
    TM.travis.urls.api = (TM.travis.urls.api || getTravisApiUrl(TM.gitHub.pullRequest));

    TM.ui = (TM.ui || createUi(TM.ui));

    // Get merge commit sha1 from GitHub
    // Get last build from Travis CI by merge commit sha1
    // Display build status
    if (!TM.gitHub.mergeCommitSha) {
      getGitHubMergeCommitSha(TM.ui, TM.gitHub, TM.travis);
    } else {
      getTravisBuildStatus(TM.ui, TM.gitHub, TM.travis);
    };
  };

  travismarklet.init();
})(jQuery); // GitHub uses jQuery
