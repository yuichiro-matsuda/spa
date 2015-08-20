/**
 * spa.chat.js
 * SPAのチャット機能モジュール
 */

 /*jslint         browser : true, continue : true,
   debel  : true, indent  : 2,      maxerr : 50.
   newcap : true, nomen   : true, plusplus : true,
   regexp : true, sloppy  : true,     vars : true,
   white  : true
  */
 /*global $, spa */

// namespace
spa.chat = (function () {
  // ----- モジュールスコープ変数開始 -----
  var
    configMap = {
      main_html : String()
        +'<div class="spa-chat">'
          + '<div class="spa-chat-head">'
            + '<div class="spa-chat-head-toggle">+</div>'
            + '<div class="spa-chat-head-title">'
              + 'Chat'
            + '</div>'
          + '</div>'
          + '<div class="spa-chat-closer">x</div>'
          + '<div class="spa-chat-sizer">'
            + '<div class="spa-chat-msgs"></div>'
            + '<div class="spa-chat-box">'
              + '<input type="text"/>'
              + '<div>send</div>'
            + '</div>'
          + '</div>'
        + '</div>',
      settable_map : {
        slider_open_time    : true,
        slider_close_time   : true,
        slider_opened_em    : true,
        slider_closed_em    : true,
        slider_opened_title : true,
        slider_closed_title : true,

        chat_model : true,
        people_model : true,
        set_chat_anchor : true
      },

      slider_open_time    : 250,
      slider_close_time   : 250,
      slider_opened_em    : 18,
      slider_closed_em    : 2,
      slider_opened_min_em : 10,
      window_height_min_em : 20,
      slider_opened_title : 'Click to close',
      slider_closed_title : 'Click to open',

      chat_model      : null,
      people_model    : null,
      set_chat_anchor : null
    },
    stateMap = {
      $append_target   : null,
      position_type    : 'closed',
      px_per_em        : 0,
      slider_hidden_px : 0,
      slider_closed_px : 0,
      slider_opened_px : 0
    },
    jqueryMap = {},

    setJqueryMap, getEmSize, setPxSizes, setSliderPosition,
    onClickToggle, configModule, initModule,
    removeSlider, handleResize
  ;
  // ----- モジュールスコープ変数終了 -----

  // ----- ユーティリティメソッド開始 -----
  getEmSize = function ( elem ) {
    return Number(
      getComputedStyle( elem, '' ).fontSize.match(/\d*\.?\d*/)[0]
    );
  };
  // ----- ユーティリティメソッド終了 -----

  // ----- DOM メソッド開始 -----
  // DOM メソッド /setJqueryMap/開始
  setJqueryMap = function () {
    var
      $append_target = stateMap.$append_target,
      $slider = $append_target.find( '.spa-chat' );

    jqueryMap = {
      $slider : $slider,
      $head   : $slider.find( '.spa-chat-head' ),
      $toggle : $slider.find( '.spa-chat-head-toggle' ),
      $title  : $slider.find( '.spa-chat-head-title' ),
      $sizer  : $slider.find( '.spa-chat-sizer' ),
      $msgs   : $slider.find( '.spa-chat-msgs' ),
      $box    : $slider.find( '.spa-chat-box' ),
      $input  : $slider.find( '.spa-chat-input input[type=text]' )
    };
  };
  // DOM メソッド /setJqueryMap/終了

  // DOM メソッド /setPxSizes/開始
  setPxSizes = function () {
    var
      px_per_em,
      window_height_em,
      opened_height_em;

      // 最初の要素を与える
      px_per_em = getEmSize( jqueryMap.$slider.get(0) );
      window_height_em = Math.floor(
        ( $(window).height() / px_per_em ) + 0.5
      );

      opened_height_em
        = window_height_em > configMap.window_height_min_em
        ? configMap.slider_opened_em
        : configMap.slider_opened_min_em;

      stateMap.px_per_em = px_per_em;
      stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
      stateMap.slider_opened_px = opened_height_em * px_per_em;
      jqueryMap.$sizer.css({
        // slider_closed_em が 2em なのでその分マイナスしている
        height : ( opened_height_em - 2 ) * px_per_em
      });
  }
  // DOM メソッド /setPxSizes/終了

  // パブリックDOMメソッド /setSliderPosition/開始
  /**
   * 用例 : spa.chat.setSliderPosition( 'closed' );
   * 目的 : チャットスライダーが要求された状態になるようにする
   * @param {enum} position_type 'closed' or 'opened' or 'hidden'
   * @param {function} callback divをあらわsyjQueryコレクション
   *
   * 動作 :
   * スライダーを要求された位置に移動する
   * 要求された位置が現在の位置の場合は何もせずにtrueを返す
   * @return {boolean} true : 要求された位置に移動した false : 要求された位置に移動していない
   *
   * 例外はなし
   */
  setSliderPosition = function ( position_type, callback ) {
    var
      height_px,
      animate_time,
      slider_title,
      toggle_text;

    // スライダーが要求された位置にある場合
    if ( stateMap.position_type === position_type ) {
      return true;
    }

    // アニメーションパラメータの用意
    switch ( position_type ) {
      case 'opened':
        height_px    = stateMap.slider_opened_px;
        animate_time = configMap.slider_open_time;
        slider_title = configMap.slider_opened_title;
        toggle_text  = '=';
        break;
      case 'hidden':
        height_px    = 0;
        animate_time = configMap.slider_open_time;
        slider_title = '';
        toggle_text  = '+';
        break;
      case 'closed':
        height_px    = stateMap.slider_closed_px;
        animate_time = configMap.slider_close_time;
        slider_title = configMap.slider_closed_title;
        toggle_text  = '+'
        break;
      default:
        // 引数が正しくない
        return false;
    }

    // スライダー位置をアニメーションで変更する
    stateMap.position_type = '';
    jqueryMap.$slider.animate(
      { height : height_px },
      animate_time,
      function () {
        jqueryMap.$toggle.prop( 'title', slider_title );
        jqueryMap.$toggle.text( toggle_text );
        stateMap.position_type = position_type;
        if ( callback ) {
          callback( jqueryMap.$slider );
        }
      }
    );
    return true;
  }
  // パブリックDOMメソッド /setSliderPosition/終了

  // -----DOM メソッド終了 -----

  // ----- イベントハンドラ開始 -----
  onClickToggle = function ( event ) {
    var set_chat_anchor = configMap.set_chat_anchor;
    if ( stateMap.position_type === 'opened' ) {
      set_chat_anchor( 'closed' );
    }
    else if ( stateMap.position_type === 'closed' ){
      set_chat_anchor( 'opened' );
    }
    return false;
  }
  // ----- イベントハンドラ終了 -----

  // ----- パブリックメソッド開始 -----
  // パブリックメソッド /configModule/開始
  /**
   * 用例 : spa.chat.configModule({ slider_open_em : 18 });
   * 目的 : 初期化前にモジュールを構成する
   * @param {function} set_chat_anchor
   *   オープンまたはクローズ状態を示すようにURIアンカーを変更するコールバック
   *   満たせない場合にはfalseを返す
   * @param {object} chat_model
   *   インスタントメッセージングとやりとりするメソッドを提供する
   *   チャットモデルオブジェクト
   * @param {[type]} people_model
   *   モデルが保持する人々のリストを管理するメソッドを提供するオブジェクト
   * @param {[type]} slider
   *   構成。全てオプションのスカラ。完全なリストはmapConfig.settable_mapを参照
   *   用例 : slider_open_emはem単位のオープン時の高さ
   * 動作 :
   *   指定された引数で内部構成データ構造(configMap)を更新する。
   *   その他の動作は行わない。
   * @param  {[type]} input_map [description]
   * @return {[boolean]}
   * 例外 :
   *   受け入れられない引数や欠如した引数ではJavaScriptエラーオブジェクトとスタックトレース
   */
  configModule = function ( input_map ) {
    spa.util.setConfigMap({
      input_map : input_map,
      settable_map : configMap.settable_map,
      config_map : configMap
    });
    return true;
  };
  // パブリックメソッド /configModule/終了

  // パブリックメソッド /initModule/開始
  /**
   * 用例 : spa.chat.initModule( $('#div_id') );
   * 目的 : ユーザに機能を提供するようにチャットに支持する
   * @param  {[type]} $append_target
   *   1つのDOMコンテナを表すjQueryコレクション
   * 動作 :
   *   指定されたコンテナにチャットスライダーを付加し、HTMLコンテンツで埋める
   *   要素、イベント、ハンドラを初期化し、ユーザにチャットルームインタフェースを提供する。
   * @return {[boolean]} true : 成功 false : 失敗
   * 例外 : なし
   */
  initModule = function ( $append_target ) {
    $append_target.append( configMap.main_html );
    stateMap.$append_target = $append_target;
    setJqueryMap();
    setPxSizes();

    // チャットスライダーをデフォルトのタイトルと状態で初期化
    jqueryMap.$toggle.prop( 'title', configMap.slider_closed_title );
    jqueryMap.$head.click( onClickToggle );
    stateMap.position_type = 'closed';

    return true;
  };
  // パブリックメソッド /initModule/終了

  // パブリックメソッド /removeSlider/開始
  /**
   * 目的 :
   *   DOM要素chatSliderを削除する
   *   初期状態に戻す
   *   コールバックや他のデータへのポインタを削除する
   * @param {[type]} none
   * @return true
   * 例外 : なし
   */
  removeSlider = function () {
     // 初期化と状態を解除する
     // DOMコンテナを削除する。これはイベントのバインディングも削除する。
     if ( jqueryMap.$slider ) {
       jqueryMap.$slider.remove();
       jqueryMap = {};
     }
     stateMap.$append_target = null;
     stateMap.position_type  = 'closed';

     // 主な構成を解除する
     // 初期化と同じ順序で行う
     configMap.chat_model      = null;
     configMap.people_model    = null;
     configMap.set_chat_anchor = null;
     return true;
   }
   // パブリックメソッド /removeSlider/終了

   // パブリックメソッド /handleResize/開始
   /**
    * 目的 :
    *   ウィンドウリサイズイベントに対し、必要に応じてこのモジュールが提供する表示を調整する
    * 動作 :
    *   ウィンドウの高さや幅が所定の僻地を下回ったら、
    *   縮小したウィンドウサイズに合わせてチャットスライダーのサイズを変更する。
    * @param {boolean}
    *   true  : リサイズを考慮した
    *   false : リサイズを考慮していない
    * 例外 : なし
    */
   handleResize = function () {
     // スライダーコンテナがなければ何もしない
     if ( ! jqueryMap.$slider ) {
       return false;
     }

     setPxSizes();
     if ( stateMap.position_type === 'opened' ) {
       jqueryMap.$slider.css({ height : stateMap.slider_opened_px });
     }
     return true;
   };

  // パブリックメソッドをエクスポート
  return {
    setSliderPosition : setSliderPosition,
    configModule      : configModule,
    initModule        : initModule,
    removeSlider      : removeSlider,
    handleResize      : handleResize
  };
  // ----- パブリックメソッド終了 -----
}());
