/**
 * spa.model.js
 * モデルモジュール
 */

 /**jslint         browser : true, continue : true,
   debel  : true, indent  : 2,      maxerr : 50.
   newcap : true, nomen   : true, plusplus : true,
   regexp : true, sloppy  : true,     vars : false,
   white  : true
  */
 /*global TAFFY, $, spa */

// namespace
spa.model = (function () {
  'use strict';
  var
    configMap = { anon_id : 'a0' },
    stateMap = {
      anon_user      : null,
      cid_serial     : 0,
      people_cid_map : {},
      people_db      : TAFFY(),
      user           : null,
      is_connected   : false
    },

    isFakeData = true,

    personProto, makeCid, clearPeopleDb, completeLogin,
    makePerson, removePerson, people, chat, initModule;

  // peopleオブジェクトAPI
  // -----
  // peopleオブジェクトはspa.model.peopleで利用できる
  // peopleオブジェクトはpersonオブジェクトの集合を管理するためのメソッドと
  // イベントを提供する。peopleオブジェクトのパブリックメソッドにはいかが含まれる。
  //  * get_user() 現在のpersonオブジェクトを返す
  //    現在のユーザがログインしていない場合には、匿名personオブジェクトを返す
  //  * get_db() あらかじめソートされた全てのpersonオブジェクト
  //    （現在のユーザを含む）のTaffyDBデータベースを返す
  //  * get_by_cid( <client_id> ) 指定された一意のIDを持つpersonオブジェクトを返す。
  //  * login( <user_name> ) 指定のユーザ名を持つユーザとしてログインする
  //    現在のユーザオブジェクトは新しいIDを反映するように変更される。
  //    ログインに成功すると[spa-login]グローバルカスタムイベントを発行する
  //  * logout() 現在のユーザオブジェクトを匿名に戻す。
  //    このメソッドは[spa-logout]グローバルカスタムイベントを発行する。
  //
  // このオブジェクトが発行するjQueryグローバルカスタムイベント
  //  * spa-login ユーザのログイン処理が完了した時に発行される
  //    更新されたユーザオブジェクトをデータとして提供する
  //  * spa-logout ログアウトの完了時に発行される
  //    以前のユーザオブジェクトをデータとして提供する
  //
  // それぞれの人personオブジェクトで表される
  // personオブジェクトが提供するメソッド
  //  * get_is_user() オブジェクトが現在のユーザの場合にtrueを返す
  //  * get_is_anon() オブジェクトが匿名の場合にtrueを返す
  //
  // personオブジェクトの属性
  //  * cid クライアントID文字列。常に定義され、
  //    クライアントデータがバックエンドと同期していない場合のみid属性とは異なる
  //  * id 一意のID。オブジェクトがバックエンドと同期していない場合には未定義になることがある
  //  * name ユーザ名文字列
  //  * css_map アバター表現に使う属性のマップ

  personProto = {
    get_is_user : function () {
      return this.cid === stateMap.user.cid;
    },
    get_is_anon : function () {
      return this.cid === stateMap.anon_user.cid;
    }
  };

  makeCid = function () {
    return 'c' + String( stateMap.cid_serial++ );
  };

  clearPeopleDb = function () {
    var user = stateMap.user;
    stateMap.people_db      = TAFFY();
    stateMap.people_cid_map = {};
    if ( user ) {
      stateMap.people_db.insert( user );
      stateMap.people_cid_map[ user.cid ] = user;
    }
  };

  // 現在のユーザ情報の更新
  completeLogin = function ( user_list ) {
    var user_map = user_list[ 0 ];
    delete stateMap.people_cid_map[ user_map.cid ];
    stateMap.user.cid = user_map._id;
    stateMap.user.id = user_map._id;
    stateMap.user.css_map = user_map.css_map;
    stateMap.people_cid_map[ user_map._id ] = stateMap.user;
    chat.join();

    // チャットに参加させる
    $.gevent.publish( 'spa-login', [ stateMap.user ] );
  };

  makePerson = function ( person_map ) {
    var person,
      cid     = person_map.cid,
      css_map = person_map.css_map,
      id      = person_map.id,
      name    = person_map.name;

    if ( cid === undefined || ! name ) {
      throw 'client id and name required';
    }

    person         = Object.create( personProto );
    person.cid     = cid;
    person.name    = name;
    person.css_map = css_map;

    if ( id ) { person.id = id; }

    stateMap.people_cid_map[ cid ] = person;

    stateMap.people_db.insert( person );
    return person;
  };

  removePerson = function ( person ) {
    if ( ! person ) { return false; }
    // 匿名ユーザは削除できない
    if ( person.id === configMap.anon_id ) {
      return false;
    }

    stateMap.people_db({ cid : person.cid }).remove();
    if ( person.cid ) {
      delete stateMap.people_cid_map[ person.cid ];
    }
    return true;
  };

  people = (function () {
    var get_by_cid, get_db, get_user, login, logout;

    get_by_cid = function ( cid ) {
      return stateMap.people_cid_map[ cid ];
    };

    get_db = function () { return stateMap.people_db; };

    get_user = function () { return stateMap.user; };

    login = function ( name ) {
      var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

      stateMap.user = makePerson({
        cid     : makeCid(),
        css_map : {top :25, left : 25, 'background-color':'#8f8'},
        name    : name
      });

      sio.on( 'userupdate', completeLogin );

      sio.emit( 'adduser', {
        cid     : stateMap.user.cid,
        css_map : stateMap.user.css_map,
        name    : stateMap.user.name
      });
    };

    logout = function () {
      var user = stateMap.user;
      // チャットルームから退出

      chat._leave();
      is_removed    = removePerson( user );
      stateMap.user = stateMap.anon_user;
      clearPeopleDb();

      $.gevent.publish( 'spa-logout', [ user ] );
      return is_removed;
    };

    return {
      get_by_cid : get_by_cid,
      get_db     : get_db,
      get_user   : get_user,
      login      : login,
      logout     : logout
    };
  }());

  // chatオブジェクトAPI
  // -----
  // chatオブジェクトはspa.model.chatで利用できる。
  // chatオブジェクトはチャットメッセージングを管理するためのメソッドとイベントを提供する
  // chatオブジェクトのパブリックメソッドは以下。
  // * join()
  //     チャットルームに参加する。このルーチンは「spa-listchange」と「spa-updatechat」
  //     グローバルカスタムイベントのためのパブリッシャを含むバックエンドとのチャットプロトコルを確立する。
  //     現在のユーザが匿名の場合、join()は中断してfalseを返す。
  // * get_chatee()
  //     ユーザがチャットしている相手のpersonオブジェクトを返す。チャット相手がいない場合はnullを返す。
  // * set_chatee( <person_id> )
  //     チャット相手をperson_idで特定されるユーザに設定する。person_idがユーザリストに存在しない場合は、
  //     チャット相手をnullに設定する。指定されたユーザがすでにチャット相手の場合はfalseを返す。
  //     「spa-setchatee」グローバルカスタムイベントを発行する。
  // * send_msg( <msg_text> )
  //     チャット相手にメッセージを送信する。「spa-updatechat」グローバルカスタムイベントを発行する。
  //     ユーザが匿名またはチャット相手がnullの場合は、中断してfalseを返す。
  // * update_avatar( <update_avtr_map> )
  //     バックエンドにupdate_avtr_mapを送信する。これにより、更新された湯０座リストとアバター情報(personオブジェクトのcss_map)
  //     を含む「spa-listchange」イベントが発行される。
  //     update_avtr_mapは以下の形式でなければならない
  //     { person_id : person_id, css_map : css_map }
  //
  // このオブジェクトが発行するjQueryグローバルカスタムイベントは以下。
  // * spa-setchatee
  //     新しいチャット相手が設定された時に発行される。
  //     以下の形式のマップをデータとして提供する。
  //     { old_chatee : <old_chatee_person_object>,
  //       new_chatee : <new_chatee_person_object>
  //     }
  // * spa-listchange
  //     オンラインユーザのリスト長が変わった時（ユーザがチャットに参加または退出した時）、
  //     または内容が変わった時（ユーザのアバター詳細が変わって時）に発行される。
  //     このイベントへの老直射は、更新データとしてpeopleモデルからpeople_dbを取得すべき。
  // * spa-updatechat
  //     新しいメッセージを送受信したときに発行される。
  //     以下の形式のマップをデータとして提供する。
  //     { dest_id : <chatee_id>,
  //       dest_name : <chatee_name>,
  //       sender_id : <sender_id>,
  //       msg_text : <message_content>
  //     }
  chat = (function () {
     var
       _publish_listchange, _publish_updatechat,
       _update_list, _leave_chat,

       get_chatee, join_chat, send_msg,
       set_chatee, update_avatar,
       chatee = null;

     // 内部メソッド開始
     _update_list = function ( arg_list ) {
       var i, person_map, make_person_map, person,
         people_list = arg_list[ 0 ],
         is_chat_online = false;

       clearPeopleDb();

       PERSON:
       for ( i = 0; i < people_list.length; i++) {
         person_map = people_list[ i ];

         if ( ! person_map.name ) { continue PERSON; }

         // ユーザを特定したら、css_mapを更新して残りを飛ばす
         if ( stateMap.user && stateMap.user.id === person_map._id ) {
           stateMap.user.css_map = person_map.css_map;
           continue PERSON;
         }

         make_person_map = {
           cid     : person_map._id,
           css_map : person_map.css_map,
           id      : person_map._id,
           name    : person_map.name
         };
         person = makePerson( make_person_map );

         if ( chatee && chatee.id === make_person_map.id ) {
           is_chat_online = true;
           chatee = person;
         }

         makePerson( make_person_map );
       }

       stateMap.people_db.sort( 'name' );

       // チャット相手がオンラインでなくなっている場合は、茶と相手を解除する。
       // その結果、「spa-setchatee」グローバルイベントが発行される。
       if ( chatee && ! is_chat_online ) { set_chatee(''); }
     };

     _publish_listchange = function ( arg_list ) {
       _update_list( arg_list );
       $.gevent.publish( 'spa-listchange', [ arg_list ] );
     };

     _publish_updatechat = function ( arg_list ) {
       var msg_map = arg_list[ 0 ];

       if ( ! chatee ) {
         set_chatee( msg_map.sender_id );
       }
       else if ( msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id) {
         set_chatee( msg_map.sender_id );
       }

       $.gevent.publish( 'spa-updatechat', [ msg_map ] );
     };
     // 内部メソッド終了

     _leave_chat = function () {
       var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
       chatee = null;
       stateMap.is_connected = false;
       if ( sio ) { sio.emit ('leavechat'); }
     };

     get_chatee = function () {
       return chatee;
     };

     join_chat = function () {
       var sio;

       if ( stateMap.is_connected ) { return false; }

       if ( stateMap.user.get_is_anon() ) {
         console.warn( 'User must be defined before joining chat');
         return false;
       }

       sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
       sio.on( 'listchange', _publish_listchange );
       sio.on( 'updatechat', _publish_updatechat );
       stateMap.is_connected = true;
       return true;
     };

     send_msg = function ( msg_text ) {
       var msg_map,
         sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

       if ( ! sio ) { return false; }
       if ( ! ( stateMap.user && chatee ) ) { return false; }

       msg_map = {
         dest_id   : chatee.id,
         dest_name : chatee.name,
         sender_id : stateMap.user.id,
         msg_text  : msg_text
       };

       // updatechatを発行したので、送信メッセージを表示できる
       _publish_updatechat( [ msg_map ] );
       sio.emit( 'updatechat', msg_map );
       return true;
     };

     set_chatee = function ( person_id ) {
       var new_chatee;
       new_chatee = stateMap.people_cid_map[ person_id ];
       if ( new_chatee ) {
         if ( chatee && chatee.id === new_chatee.id ) {
           return false;
         }
       }
       else {
         new_chatee = null;
       }

       $.gevent.publish( 'spa-setchatee',
         { old_chatee : chatee, new_chatee : new_chatee }
       );
       chatee = new_chatee;
       return true;
     };

     // avatar_update_mapは以下の形式を持つべき
     // { person_id : <string>, css_map : {
     //   top : <int>, left : <int>,
     //   'background-color' : <string>
     // }};
     //
     update_avatar = function ( avatar_update_map ) {
       var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
       if ( sio ) {
         sio.emit( 'updateavatar', avatar_update_map );
       }
     };

     return {
       _leave        : _leave_chat,
       get_chatee    : get_chatee,
       join          : join_chat,
       send_msg      : send_msg,
       set_chatee    : set_chatee,
       update_avatar : update_avatar
     };
  }());

  initModule = function () {
    // 匿名ユーザの初期化
    stateMap.anon_user = makePerson({
      cid  : configMap.anon_id,
      id   : configMap.anon_id,
      name : 'anonymous'
    });
    stateMap.user = stateMap.anon_user;
  };

  return {
    initModule : initModule,
    chat       : chat,
    people     : people
  };
}());
