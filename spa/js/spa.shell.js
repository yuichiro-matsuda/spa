/**
 * spa.shell.js
 * SPAのシェルモジュール
 */

 /*jslint         browser : true, continue : true,
   debel  : true, indent  : 2,      maxerr : 50.
   newcap : true, nomen   : true, plusplus : true,
   regexp : true, sloppy  : true,     vars : true,
   white  : true
  */
 /*global $, spa */
 spa.shell = (function () {
   // ----- モジュールスコープ変数開始 -----
   var
     configMap = {
       anchor_schema_map : {
         chat : { open : true, closed : true }
       },
       main_html : String()
       + '<div class="spa-shell-head">'
         + '<div class="spa-shell-head-logo"></div>'
         + '<div class="spa-shell-head-acct"></div>'
         + '<div class="spa-shell-head-search"></div>'
       + '</div>'
       + '<div class="spa-shell-main">'
         + '<div class="spa-shell-main-nav"></div>'
         + '<div class="spa-shell-main-content"></div>'
       + '</div>'
       + '<div class="spa-shell-foot"></div>'
       + '<div class="spa-shell-chat"></div>'
       + '<div class="spa-shell-modal"></div>',
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
       is_chat_retarcted : true
     },
     jqueryMap = {},

     copyAnchorMap, setJqueryMap, toggleChat,
     changeAnchorPart, onHashchange,
     onClickChat, initModule;
   // ----- モジュールスコープ変数終了 -----

   // ----- ユーティリティメソッド開始 -----
   // 格納したアンカーマップのコピーを返す。オーバヘッドを最小にする。
   copyAnchorMap = function () {
     return $.extend( true, {}, stateMap.anchor_map );
   }
   // ----- ユーティリティメソッド終了 -----

   // ----- DOM メソッド開始 -----
   // DOM メソッド /setJqueryMap/開始
   setJqueryMap = function () {
     var $container = stateMap.$container;
     jqueryMap = {
       $container : $container,
       $chat : $container.find( '.spa-shell-chat' )
     };
   }
   // DOM メソッド /setJqueryMap/終了

   // DOM メソッド /toggleChat/開始
   //
   /**
    * チャットスライダーの拡大・格納
    * stateMap.is_chat_retarcted
    * 		true  : スライダーは格納されている
    *   	false : スライダーは拡大されている
    * @param  {[boolean]}   do_extend [true : スライダーを拡大 false : スライダーを格納]
    * @param  {Function} callback  [アニメーション後に開始する関数]
    * @return {[boolean]}          [true : アニメーションが開始された false : アニメーションが開始されなかった]
    */
   toggleChat = function ( do_extend, callback ) {
     var
       px_chat_ht = jqueryMap.$chat.height();
       is_open = px_chat_ht === configMap.chat_extend_height,
       is_closed = px_chat_ht === configMap.chat_retract_height,
       is_sliding = ! is_open && ! is_closed;

    // 競合状態を避ける
    if ( is_sliding ){ return false; }

    // チャットスライダーの拡大開始
    if ( do_extend ) {
      jqueryMap.$chat.animate(
        { height : configMap.chat_extend_height },
        configMap.chat_extend_time,
        function () {
          jqueryMap.$chat.attr(
            'title', configMap.chat_extended_title
          );
          stateMap.is_chat_retarcted = false;
          if ( callback ){ callback( $jqueryMap.$chat ); }
        }
      );
      return true;
    }
    // チャットスライダーの拡大終了

    // チャットスライダーの格納開始
    jqueryMap.$chat.animate(
      { height : configMap.chat_retract_height },
      configMap.chat_retract_time,
      function () {
        jqueryMap.$chat.attr(
          'title', configMap.chat_retracted_title
        );
        stateMap.is_chat_retarcted = true;
        if ( callback ){ callback( $jqueryMap.$chat ); }
      }
    );
    return true;
    // チャットスライダーの格納終了
   };
   // DOM メソッド /toggleChat/終了

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
         case 'open':
           toggleChat( true );
           break;
         case 'closed':
           toggleChat( false );
           break;
         default:
           toggleChat( false );
           delete anchor_map_proposed.chat;
           $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
       }
     }
     // 変更されている場合のチャットコンポーネントの調整終了
     return false;
   };
   // イベントハンドラ /onHashchange/終了

   // イベントハンドラ /onClickChat/開始
   onClickChat = function ( event ) {
     if ( toggleChat( stateMap.is_chat_retarcted ) ) {
       changeAnchorPart({
         chat : ( stateMap.is_chat_retarcted ? 'open' : 'closed' )
       });
     }
     return false;
   };
   // イベントハンドラ /onClickChat/終了

   // ----- イベントハンドラ終了 -----

   // ----- パブリックメソッド開始 -----

   // パブリックメソッド /initModule/開始
   initModule = function ( $container ) {
     // HTMLをロードし、jQueryコレクションをマッピングする
     stateMap.$container = $container;
     $container.html( configMap.main_html );
     setJqueryMap();

     // チャットスライダーを初期化、クリックハンドラをバインド
     stateMap.is_chat_retarcted = true;
     jqueryMap.$chat
       .attr( 'title', configMap.chat_retracted_title )
       .click( onClickChat );

     // uriAnchorの設定
     $.uriAnchor.configModule({
       schema_map : configMap.anchor_schema_map
     });

     // URIアンカー変更イベントを処理する
     // 全ての機能モジュールの初期化後に行わないと、イベントを処理できない
     // トリガーイベントはアンカーがロード状態とみなせることを保証するために使う
     $(window)
       .bind( 'hashchange', onHashchange )
       .trigger( 'hashchange' );

   // 切り替えをテスト
   //  setTimeout( function () { toggleChat( true ); }, 3000);
   //  setTimeout( function () { toggleChat( false ); }, 3000);
   };

   // パブリックメソッド /initModule/終了
   return { initModule : initModule };
   // ----- パブリックメソッド終了 -----
 }());
