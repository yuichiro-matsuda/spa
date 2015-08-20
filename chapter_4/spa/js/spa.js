/**
 * spa.js
 * ルート名前空間モジュール
 */

 /*jslint         browser : true, continue : true,
   debel  : true, indent  : 2,      maxerr : 50.
   newcap : true, nomen   : true, plusplus : true,
   regexp : true, sloppy  : true,     vars : true,
   white  : true
  */
 /*global $, spa:true*/

var spa = (function () {
  var initModule = function ( $container ) {
    spa.shell.initModule( $container );
  };

  return { initModule : initModule };
}());