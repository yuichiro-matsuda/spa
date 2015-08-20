/**
 * spa.shell.js
 * SPAのシェルモジュール
 */

 /**jslint         browser : true, continue : true,
   debel  : true, indent  : 2,      maxerr : 50.
   newcap : true, nomen   : true, plusplus : true,
   regexp : true, sloppy  : true,     vars : true,
   white  : true
  */
 /*global $, spa */

 spa.shell = (function () {
   'use strict';
   // ----- モジュールスコープ変数開始 -----
   var
     configMap = {
       anchor_schema_map : {
         chat : { opened : true, closed : true }
       },
       main_html : String()                            +
        '<div class="spa-shell-head">'                 +
          '<div class="spa-shell-head-logo">'          +
            '<h1>SPA</h1>'                             +
            '<p>javascript end to end</p>'             +
          '</div>'                                     +
          '<div class="spa-shell-head-acct"></div>'    +
        '</div>'                                       +
        '<div class="spa-shell-main">'                 +
          '<div class="spa-shell-main-nav"></div>'     +
          '<div class="spa-shell-main-content"></div>' +
        '</div>'                                       +
        '<div class="spa-shell-foot"></div>'           +
        '<div class="spa-shell-modal"></div>',
       resize_interval     : 200,
       chat_extend_time    : 1000,
       chat_retract_time   : 300,
       chat_extend_height  : 450,
       chat_retract_height : 15,
       chat_extended_title   : 'Click to retract',
       chat_retracted_title  : 'Click to expand'
     },
     stateMap = {
       $container        : null,
       anchor_map        : {},
       resize_idto       : undefined
     },
     jqueryMap = {},

     copyAnchorMap, setJqueryMap, changeAnchorPart,
     onResize,      onHashchange,
     onTapAcct,     onLogin,      onLogout,
     setChatAnchor, initModule;
   // ----- モジュールスコープ変数終了 -----

   // ----- ユーティリティメソッド開始 -----
   // 格納したアンカーマップのコピーを返す。オーバヘッドを最小にする。
   copyAnchorMap = function () {
     return $.extend( true, {}, stateMap.anchor_map );
   };
   // ----- ユーティリティメソッド終了 -----

   // ----- DOM メソッド開始 -----
   // DOM メソッド /setJqueryMap/開始
   setJqueryMap = function () {
     var $container = stateMap.$container;
     jqueryMap = {
       $container : $container,
       $acct      : $container.find('.spa-shell-head-acct'),
       $nav       : $container.find('.spa-shell-main-nav')
     };
   };
   // DOM メソッド /setJqueryMap/終了

   /**
    *
    *
    * @param  {[type]} arg_map [description]
    * @return {[boolean]}         [true : URI変更成功 false : URI変更失敗]
    */
   // DOM メソッド /changeAnchorPart/開始
   changeAnchorPart = function ( arg_map ) {
     var
       anchor_map_revise = copyAnchorMap(),
       bool_return = true,
       key_name, key_name_dep;

       // アンカーマップへ変更を統合開始
       KEYVAL:
       for ( key_name in arg_map ) {
         if ( arg_map.hasOwnProperty( key_name ) ) {
           // 反復中に従属キーを飛ばす
           if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }
           // 独立キー値を更新する
           anchor_map_revise[key_name] = arg_map[key_name];
           // 合致する独立キーを更新する
           key_name_dep = '_' + key_name;
           if ( arg_map[key_name_dep] ) {
             anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
           }
           else {
             delete anchor_map_revise[key_name_dep];
             delete anchor_map_revise['_s' + key_name_dep];
           }
         }
       }
       // アンカーマップへ変更を統合終了

       // URIの更新開始 成功しなければ元に戻す
       try {
         $.uriAnchor.setAnchor( anchor_map_revise );
       }
       catch ( error ) {
         // URIを既存の状態に戻す
         $.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
         bool_return = false;
       }
       // URI更新完了

       return bool_return;
   };
   // DOM メソッド　/changeAnchorPart/終了
   // ----- DOM メソッド終了 -----

   // ----- イベントハンドラ開始 -----

   // イベントハンドラ /onHashchange/開始
   onHashchange = function ( event ) {
     var
       anchor_map_previous = copyAnchorMap(),
       anchor_map_proposed,
       is_ok = true,
       _s_chat_previous, _s_chat_proposed,
       s_chat_proposed;

     // アンカーの解析を試みる
     try {
       anchor_map_proposed = $.uriAnchor.makeAnchorMap();
     } catch ( error ) {
       $.uriAnchor.setAnchor( anchor_map_previous, null, true );
       return false;
     }
     stateMap.anchor_map = anchor_map_proposed;

     // 一時保存用？
     _s_chat_previous = anchor_map_previous._s_chat;
     _s_chat_proposed = anchor_map_proposed._s_chat;

     // 変更されている場合のチャットコンポーネントの調整開始
     if ( ! anchor_map_previous || _s_chat_previous !==  _s_chat_proposed ) {
       s_chat_proposed = anchor_map_proposed.chat;
       switch ( s_chat_proposed ) {
         case 'opened':
           is_ok = spa.chat.setSliderPosition( 'opened' );
           break;
         case 'closed':
           is_ok = spa.chat.setSliderPosition( 'closed' );
           break;
         default:
           toggleChat( false );
           delete anchor_map_proposed.chat;
           $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
       }
     }
     // 変更されている場合のチャットコンポーネントの調整終了

     // スライダーの変更が拒否された場合にアンカーを戻す処理開始
     if ( ! is_ok ) {
       if ( anchor_map_previous ) {
         $.uriAnchor.setAnchor( anchor_map_previous, null, true );
         stateMap.anchor_map = anchor_map_previous;
       } else {
         delete anchor_map_proposed.chat;
         $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
       }
     }
     // スライダーの変更が拒否された場合にアンカーを戻す処理終了

     return false;
   };
   // イベントハンドラ /onHashchange/終了

   // イベントハンドラ /onResize/開始
   onResize = function () {
     if ( stateMap.resize_idto ) { return true; }

     spa.chat.handleResize();
     stateMap.resize_idto = setTimeout(
       function () { stateMap.resize_idto = undefined; },
       configMap.resize_interval
     );

     return true;
   };
   // イベントハンドラ /onResize/終了

   onTapAcct = function ( event ) {
     var acct_text, user_name, user = spa.model.people.get_user();
     if ( user.get_is_anon() ) {
        user_name = prompt( 'Please sign-in' );
        spa.model.people.login( user_name );
        jqueryMap.$acct.text( '... processing ...' );
     }else {
       spa.model.people.logout();
     }
     return false;
   };

   onLogin = function ( event, login_user ) {
     jqueryMap.$acct.text( login_user.name );
   };

   onLogout = function ( event, logout_user ) {
     jqueryMap.$acct.text( 'Please sign-in' );
   };

   // ----- イベントハンドラ終了 -----

   // ----- コールバック開始 -----
   // コールバックメソッド /setChatAnchor/開始
   /**
    * 用例 : setChatAnchor( 'closed' );
    * 目的 : アンカーのチャットコンポーネントを変更する
    * @param {String} position_type 'closed' or 'opened'
    *
    * 動作 : 可能ならURIアンカーパラメータ[chat]を要求値に変更する。
    * @return {boolean}
    *   true : 要求されたアンカー部分が更新された
    *   false : 要求されたアンカー部分が更新されなかった
    * 例外 : なし
    */
   setChatAnchor = function ( position_type ) {
     return changeAnchorPart({ chat : position_type });
   };
   // コールバックメソッド /setChatAnchor/終了
   // ----- コールバック終了 -----

   // ----- パブリックメソッド開始 -----

   // パブリックメソッド /initModule/開始
   /**
    * 用例 : spa.shell.initModule( $('#app_div_id') );
    * 目的 : ユーザに機能を提供するようチャットに指示する
    * @param  {[type]} $container 1つのDOMコンテナを表すjQueryコレクション
    *
    * 動作 :
    *   $containerにUIのシェルを含め、機能モジュールを構成して初期化する。
    *   シェルはURIアンカーやCookieの管理などのブラウザ全体に及ぶ問題を担当する
    * @return なし
    * 例外 : なし
    */
   initModule = function ( $container ) {
     // HTMLをロードし、jQueryコレクションをマッピングする
     stateMap.$container = $container;
     $container.html( configMap.main_html );
     setJqueryMap();

     // uriAnchorの設定
     $.uriAnchor.configModule({
       // opened, closedがあることを教える
       schema_map : configMap.anchor_schema_map
     });

     // 機能モジュールを構成して初期化する
     spa.chat.configModule({
       set_chat_anchor : setChatAnchor,
       chat_model      : spa.model.chat,
       people_model    : spa.model.people
     });
     spa.chat.initModule( jqueryMap.$container );

     // URIアンカー変更イベントを処理する
     // 全ての機能モジュールの初期化後に行わないと、イベントを処理できない
     // トリガーイベントはアンカーがロード状態とみなせることを保証するために使う
     $(window)
       .bind( 'resize', onResize )
       .bind( 'hashchange', onHashchange )
       .trigger( 'hashchange' );

     // spa-login イベントを onLogin イベントハンドラにひもづける
     $.gevent.subscribe( $container, 'spa-login', onLogin );
     $.gevent.subscribe( $container, 'spa-logout', onLogout );

     jqueryMap.$acct
       .text( 'Please sign-in' )
       .bind( 'utap', onTapAcct );

   // 切り替えをテスト
   //  setTimeout( function () { toggleChat( true ); }, 3000);
   //  setTimeout( function () { toggleChat( false ); }, 3000);
   };

   // パブリックメソッド /initModule/終了
   return { initModule : initModule };
   // ----- パブリックメソッド終了 -----
 }());
