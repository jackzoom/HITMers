const event = require('../../utils/event');
const request = require('../../utils/requests');
const util = require('../../utils/util');
const userAdapter = require('../../utils/user-adapter');
const update = require('../../utils/update');

let globalData = getApp().globalData;

Page({
  data: {
    logged: false,
    language: '',
    languages: ['简体中文', 'English'],
    langIndex: 0,
    showLoginPopup: false,
    showRegisterPopup: false,
    showChangePasswordPopup: false,
    loading: true
  },

  onLoad: function () {
    this.setData({
      langIndex: globalData.langIndex,
      logged: globalData.logged,
      stuId: globalData.stuId,
      stuName: globalData.stuName,
      loading: false
    });
    this.setLanguage();
  },

  changeLanguage(e) {
    let index = e.detail.value;
    this.setData({
      langIndex: index
    });
    wx.T.setLocaleByIndex(index);
    this.setLanguage();
    event.emit('languageChanged');

    globalData.langIndex = this.data.langIndex;
    globalData.language = globalData.languages[wx.T.langCode[this.data.langIndex]];
  },

  setLanguage() {
    this.setData({
      language: wx.T.getLanguage()
    });
    wx.T.setTabBarLang(this.data.langIndex);
    wx.T.setNavigationBarTitle();
  },

  toggleRegisterPopup() {
    this.setData({
      showRegisterPopup: !this.data.showRegisterPopup
    });
  },
  toggleLoginPopup() {
    this.setData({
      showLoginPopup: !this.data.showLoginPopup
    });
  },
  toggleChangePasswordPopup() {
    this.setData({
      showChangePasswordPopup: !this.data.showChangePasswordPopup
    });
  },
  abandonInfo() {
    this.setData({
      showLoginPopup: false
    });
  },
  abandonPassword() {
    this.setData({
      showChangePasswordPopup: false
    });
  },
  abandonRegister() {
    this.setData({
      showRegisterPopup: false
    });
  },
  loginRequest(id, password) {
    return request.login(id, password)
      .then(res => {
        if(res.statusCode === 200) {
          this.setData({
            logged: true,
            stuId: id,
            stuName: res.data.user.name,
            stuPassword: password
          });
          globalData.stuId = this.data.stuId;
          globalData.stuName = this.data.stuName;
          globalData.stuPassword = this.data.stuPassword;
          globalData.logged = true;
          globalData.token = res.data.token;
          globalData.user = userAdapter.getClientUser(res.data.user);
          util.show(this.data.language.loginSucceed, 'success');
        }
      });
  },
  submitInfo(event) {
    if(this.isIdLegal(event.detail.value.stuId) && 
      this.isPasswordLegal(event.detail.value.stuPassword)) {  
    
      this.loginRequest(event.detail.value.stuId, event.detail.value.stuPassword);
        
      this.setData({
        showLoginPopup: false
      });
    }
  },
  submitRegister(event) {
    let values = event.detail.value;
    if(this.isIdLegal(values.stuId) && 
      this.isNameValid(values.stuName) &&
      this.isPasswordLegal(values.stuPassword) &&
      this.isPasswordEqual(values.stuPassword, values.confirmPassword)) {  
      this.setData({
        showRegisterPopup: false
      });
      request.register(
        {
          id: values.stuId,
          name: values.stuName,
          password: values.stuPassword
        },
        values.registerCode
      ).then(res => {
        if(res.statusCode === 200) {
          util.show(this.data.language.registerSucceed, 'success');
          this.loginRequest(values.stuId, values.stuPassword)
            .then(() => {
              wx.navigateTo({url: '/pages/index/profile'});
            });
        }
      });
    }
  },

  // zan ui 的 bug，这样做是为了响应最后 field 的键盘上的√被按下
  handleFieldChange() {
    // do nothing
  },
  register() {
    this.setData({
      showRegisterPopup: true
    });
  },
  login() {
    this.setData({
      showLoginPopup: true
    });
  },

  changePassword() {
    this.setData({
      showChangePasswordPopup: true
    });
  },

  isIdLegal(id) {
    if(id == null || !/^\w+$/.test(id)) {
      util.show(this.data.language.stuId.illegal, 'fail');
      return false;
    }
    return true;
  },
  isNameValid(name) {
    if(name == null || !/^[\u4e00-\u9fa5]+$/gm.test(name)) {
      util.show(this.data.language.stuName.illegal, 'fail');
      return false;
    }
    return true;
  },
  isPasswordLegal(password) {
    if(password === '' || password === null) {
      util.show(this.data.language.illegalPassword, 'fail');
      return false;
    }
    return true;
  },
  isPasswordEqual(password, confirmPassword) {
    if(password === confirmPassword) {
      return true;
    }
    util.show(this.data.language.passwordNotMatch, 'fail');
    return false;
  },

  submitPassword(event) {
    let oldPassword = event.detail.value.oldPassword;
    let newPassword = event.detail.value.newPassword;

    let that = this;
    if(oldPassword !== this.data.stuPassword) {
      util.show(this.data.language.wrongOldPassword, 'fail');
    } 
    else if(this.isPasswordLegal(newPassword)) {
      request.updateUser(this.data.stuId, {password: newPassword})
        .then(res => {
          if(res.data.password_changed_times) {
            this.setData({
              showChangePasswordPopup: false
            });
            this.data.stuPassword = newPassword;
            util.show(that.data.language.changePasswordSucceed, 'success');
          } else {
            util.show(that.data.language.changePasswordFailed, 'fail');
          }
        });
    }
  },

  logout: function () {
    globalData.logged = false;
    this.setData({
      logged: false
    });
  },

  update() {
    update(this.data.language);
  }
});
