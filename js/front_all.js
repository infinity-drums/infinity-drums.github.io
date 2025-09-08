var trycount = 0;
var liff_id_test = "2006807509-DwjmX2JY";
var liff_id_official = "2006807509-D4BqyPwJ";
$(document).ready(function () {
  checkLogin("init");
  $('#checkLoginButton').click(function () {
    checkLogin("reinit");
  });
  $("#imageInput").on('change', function (e) {
    var fileName = e.target.files[0].name;
    var ttype = e.target.files[0].type;
    var input = this;
    if (ttype == "image/png" || ttype == "image/jpg" || ttype == "image/jpeg") {
      //將圖片放上預覽
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          $("#img_preview_div").show();
          $('#preview_image').attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
      } else {
        $("#img_preview_div").hide();
        let origin_img = $("#origin_img").val();
        $('#preview_image').attr('src', origin_img);
      }
    }
    else {
      $("#store_logo_file").val(''); let origin_img = $("#origin_img").val(); $('#preview_image').attr('src', origin_img);
      Swal.fire({
        title: "您上傳的格式不對哦",
        icon: "warning",
        confirmButtonText: "確認"
      });
    }
  });
})
function checkLogin(action) {
  liff
    .init({
      liffId: liff_id_official, // Use own liffId
    })
    .then(() => {
      // 檢查是否已登入
      // console.log("liff.isLoggedIn() = "+liff.isLoggedIn());
      if (!liff.isLoggedIn()) {
        if (action == "init") {
          $("#popup_line").show();
        }
        else {
          $("#popup_line").hide();
          let nowurl = window.location.href;
          liff.login(nowurl);
        }
      } else {
        $("#popup_line").hide();
        let idToken = liff.getIDToken(); // 獲取 LINE 平台提供的 ID Token
        // console.log(idToken);
        liff
          .getProfile()
          .then((profile) => {
            let name = profile.displayName;
            if (!idToken) { console.error('無法獲取 ID Token'); return; }
            // 確保已獲取 Token 後發送資料
            getTokenFromServer(profile.userId, profile.pictureUrl, profile.displayName, idToken, "inituser");
            // 將資料發送到伺服器
          })
          .catch((err) => { console.log("error", err); });
      }
    })
    .catch((err) => {
      console.log(err.code, err.message);
    });
}
// 從伺服器獲取 Token
function getTokenFromServer(userId, pictureUrl, displayName, idToken, action) {
  $.ajax({
    type: "POST",
    url: "./API/get_token.php?k=secure_static_key",
    dataType: "json",
    success: function (response) {
      let token = response.token;
      sendUserDataToServer(userId, pictureUrl, displayName, idToken, token);
    },
    error: function (jqXHR, textStatus, errorMessage) { return; }
  });
}
// 發送使用者資料到伺服器
function sendUserDataToServer(userId, pictureUrl, displayName, idToken, token) {
  // console.log(token);
  if (token == "" && token == null && token == undefined) {
    // console.log("token is empty");
    return;
  }
  $("#VT").val(token);
  Swal.fire({
    title: "請稍候",
    didOpen: () => {
      Swal.showLoading();
      $(".chzn-single").hide();
    },
  }).then((result) => { });
  $.ajax({
    url: './API/api.php',
    method: 'POST',
    headers: { Authorization: token },
    data: {
      action: 'save_user_data',
      user_id: userId,
      pictureUrl: pictureUrl,
      display_name: displayName,
      idToken: idToken,
    },
    dataType: "json",
    success: function (response) {
      Swal.hideLoading(); Swal.close();
      // console.log(response);
      if (response.success && response.status == 200) {
        //表示初始化登入成功，寫入user 
      }
      else {
        //表示為第二次進入，或是重新整理頁面等等
        if (response.message == "uid already exist") {
          //可以進行後續動作
          let udata = response.data;
          $("#name").val(udata[0].user_name);
          $("#email").val(udata[0].email);
          $("#phone").val(udata[0].mobile);
          // console.log(udata[0].user_name);
        }
      }
    },
    error: function (jqXHR, textStatus, errorMessage) {
      Swal.hideLoading(); Swal.close();
      console.log(jqXHR);
      console.log(jqXHR.responseText);
      console.log(textStatus);
      console.log(errorMessage);
      if (trycount >= 3) { }
      else {
        trycount++;
        // init();
        sendUserDataToServer(userId, pictureUrl, displayName, idToken, token);
      }
    }
  });
}
function check_data_right(data, format_data) {
  if (data == "" || data == null || data == undefined) {
    return false;
  }
  else {
    if (format_data == "email") {
      let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!regex.test(data)) {
        return false;
      }
    }
    if (format_data == "phone") {
      let regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!regex.test(data)) {
        return false;
      }
    }
    return true;
  }
}
function sendDataToServer() {
  let token = $("#VT").val();
  let name = $("#name").val();
  let email = $("#email").val();
  let phone = $("#phone").val();
  if (check_data_right(name, "name") == false || check_data_right(email, "email") == false || check_data_right(phone, "phone") == false) {
    Swal.fire({
      title: "資料尚未填寫完成",
      icon: "warning",
      confirmButtonText: "繼續填寫"
    });
    return;
  }
  let fileInput = document.getElementById('imageInput');
  // 確認是否選擇了圖片
  if (!fileInput.files.length) {
    Swal.fire({
      title: "請選擇一張圖片",
      icon: "warning",
      confirmButtonText: "確認"
    });
    return;
  }
  // 確認文件是否已選擇
  if (!fileInput.files || !fileInput.files[0]) {
    console.error('圖片未選擇，請確認文件輸入框的值。');
    return;
  }
  let formData = new FormData();
  formData.append('action', 'save_data');
  formData.append('image', fileInput.files[0]);
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', phone);

  liff.init({
      liffId: liff_id_official, // Use own liffId
    })
    .then(() => {
      let idToken = liff.getIDToken(); // 獲取 LINE 平台提供的 ID Token
      if (!idToken) { console.error('無法獲取 ID Token'); return; }
      formData.append('idToken', idToken);
      liff
        .getProfile()
        .then((profile) => {
          let open_id = profile.userId;
          formData.append('open_id', open_id);
          Swal.fire({
            title: "稍後，資料處理中",
            didOpen: () => {
              Swal.showLoading();
              $(".chzn-single").hide();
            },
          }).then((result) => { });
          $.ajax({
            url: './API/api.php',
            method: 'POST',
            headers: { Authorization: token },
            data: formData,
            processData: false,
            contentType: false,
            dataType: "json",
            success: function (response) {
              Swal.hideLoading(); Swal.close();
              console.log(response);
              if (response.status == 200 || response.status == "200") {
                // Swal.fire({
                //   icon: "success",
                //   title: '發票已登錄成功',
                //   confirmButtonText: '繼續上傳',
                // }).then((result) => {
                //   location.reload();
                // })
                var sendSecceccModal = new bootstrap.Modal(document.getElementById('sendSecceccModal'), {
                  keyboard: false
                })
                $('#continueBtn').click(function (e) {
                  e.preventDefault();
                  // $("#img_preview_div").hide();
                  // $('#preview_image').attr('src', '');
                  location.reload();
                });
                sendSecceccModal.show()
              }
              else {
                Swal.fire({
                  icon: "error",
                  title: "新增失敗",
                  text: "請重新整理頁面再試試看",
                });
              }
            },
            error: function (jqXHR, textStatus, errorMessage) {
              Swal.hideLoading(); Swal.close();
              console.log(jqXHR);
              console.log(jqXHR.responseText);
              console.log(textStatus);
              console.log(errorMessage);
              Swal.fire({
                icon: "error",
                title: "新增失敗",
                text: "請重新整理頁面再試試看",
              });
            }
          });
        })
        .catch((err) => { Swal.hideLoading(); Swal.close(); console.log("error", err); });

    })
    .catch((err) => {
      console.log(err.code, err.message);
    });
}