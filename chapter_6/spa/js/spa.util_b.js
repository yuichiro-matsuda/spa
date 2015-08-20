/**
 * spa.util_b.js
 * アバター機能モジュール
 */

/**jslint         browser : true, continue : true,
  debel  : true, indent  : 2,      maxerr : 50.
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true,     vars : true,
  white  : true
 */

/*global $, spa */

spa.util_b = (function () {
  'use strict';

  // モジュールスコープ変数開始
  var
    configMap = {
      regex_encode_html  : /[&"'><]/g,
      regex_encode_noamp : /["'><]/g,
      html_encode_map : {
        '&' : '&#38;',
        '"' : '&#34;',
        "'" : '&#39;',
        '>' : '&#62;',
        '<' : '&#60;'
      }
    },

    decodeHtml, encodeHtml, getEmSize;

  configMap.encode_noamp_map = $.extend(
    {}, configMap.html_encode_map
  );
  delete configMap.encode_noamp_map['&'];
  // モジュールスコープ変数終了

  // ユーティリティメソッド開始
  // decodeHtml/開始
  decodeHtml = function ( str ) {
    return $('<div/>').html(str || '').text();
  };
  // decodeHtml/終了

  // encodeHtml/開始
  encodeHtml = function ( input_arg_str, exclude_amp ) {
    var
      input_str = String( input_arg_str ),
      regex, lookup_map;
    if ( exclude_amp ) {
      lookup_map = configMap.encode_noamp_map;
      regex = configMap.regex_encode_html;
    }
    else {
      lookup_map = configMap.html_encode_map;
      regex = configMap.regex_encode_noamp;
    }
    return input_str.replace(regex,
      function ( match, name ) {
        return lookup_map[ match ]|| '';
      }
    );
  };
  // encodeHtml/終了

  // getEmSize/開始
  getEmSize = function ( elem ) {
    return Number(
      getComputedStyle( elem, '' ).fontSize.match(/\d*\.?\d*/)[0]
    );
  };
  // getEmSize/終了

  // メソッドエクスポート
  return {
    decodeHtml : decodeHtml,
    encodeHtml : encodeHtml,
    getEmSize  : getEmSize
  };
  // パブリックメソッド終了
}());
