$(document).ready(function () {
  var animating = false;
  var decisionVal = 80;
  var pullDeltaX = 0;
  var deg = 0;
  var $card, $cardReject, $cardLike;

  function pullChange() {
    animating = true;
    deg = pullDeltaX / 10;
    $card.css(
      "transform",
      "translateX(" + pullDeltaX + "px) rotate(" + deg + "deg)"
    );

    var opacity = pullDeltaX / 100;
    var rejectOpacity = opacity >= 0 ? 0 : Math.abs(opacity);
    var likeOpacity = opacity <= 0 ? 0 : opacity;
    $cardReject.css("opacity", rejectOpacity);
    $cardLike.css("opacity", likeOpacity);
  }

  function release() {
    if (pullDeltaX >= decisionVal) {
      navigator.vibrate(10);
      $card.addClass("to-right");
      markPresent($card[0].id);
    } else if (pullDeltaX <= -decisionVal) {
      navigator.vibrate(10);
      $card.addClass("to-left");
      markAbsent($card[0].id);
    }

    if (Math.abs(pullDeltaX) >= decisionVal) {
      $card.addClass("inactive");
    }

    if (Math.abs(pullDeltaX) < decisionVal) {
      $card.addClass("reset");
    }

    setTimeout(function () {
      $card
        .attr("style", "")
        .removeClass("reset")
        .find(".student__card__choice")
        .attr("style", "");

      pullDeltaX = 0;
      animating = false;
    }, 300);
  }

  $(document).on(
    "mousedown touchstart",
    ".student__card:not(.inactive)",
    function (e) {
      if (animating) return;

      $card = $(this);
      $cardReject = $(".student__card__choice.m--reject", $card);
      $cardLike = $(".student__card__choice.m--like", $card);
      var startX = e.pageX || e.originalEvent.touches[0].pageX;

      $(document).on("mousemove touchmove", function (e) {
        var x = e.pageX || e.originalEvent.touches[0].pageX;
        pullDeltaX = x - startX;
        if (!pullDeltaX) return;
        pullChange();
      });

      $(document).on("mouseup touchend", function () {
        $(document).off("mousemove touchmove mouseup touchend");
        if (!pullDeltaX) return; // prevents from rapid click events
        release();
      });
    }
  );
});

var data = [];

const today = new Date();

var options = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

data.push([today.toLocaleDateString("en-US", options)]);

function markPresent(rollNo) {
  navigator.vibrate(10);
  data.push(["Present"]);
  console.log(data);
}
function markAbsent(rollNo) {
  navigator.vibrate(10);
  data.push(["Absent"]);
  console.log(data);
}

async function sendData() {
  axios.put("", {
    data: data,
  });

  alert("Saved");

  window.location.href = "/";
}
