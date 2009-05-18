(function(){var E=YUI.Env,G=YUI.config,F=G.doc,B=G.pollInterval||40,A=function(C){E._ready();};if(!E._ready){E._ready=function(){if(!E.DOMReady){E.DOMReady=true;if(F.removeEventListener){F.removeEventListener("DOMContentLoaded",A,false);}}};if(navigator.userAgent.match(/MSIE/)){E._dri=setInterval(function(){try{document.documentElement.doScroll("left");clearInterval(E._dri);E._dri=null;A();}catch(C){}},B);}else{F.addEventListener("DOMContentLoaded",A,false);}}})();YUI.add("event",function(D){(function(){var G=YUI.Env,E=D.Env.evt.plugins,F=function(){D.fire("domready");};D.mix(E,{domready:{},"event:ready":{on:function(){var H=D.Array(arguments,0,true);H[0]="domready";return D.subscribe.apply(D,H);},detach:function(){var H=D.Array(arguments,0,true);H[0]="domready";return D.unsubscribe.apply(D,H);}}});D.publish("domready",{fireOnce:true});if(G.DOMReady){F();}else{D.before(F,G,"_ready");}})();(function(){var G={altKey:1,cancelBubble:1,ctrlKey:1,clientX:1,clientY:1,detail:1,keyCode:1,metaKey:1,shiftKey:1,type:1,x:1,y:1},F=D.UA,E={63232:38,63233:40,63234:37,63235:39,63276:33,63277:34,25:9},H=function(J){if(!J){return null;}try{if(F.webkit&&3==J.nodeType){J=J.parentNode;}}catch(I){}return D.Node.get(J);};D.DOMEventFacade=function(S,K,J,I){var O=S,M=K,P=D.config.doc,T=P.body,U=O.pageX,R=O.pageY,L=(S._YUI_EVENT),N,Q,V;for(N in G){if(G.hasOwnProperty(N)){this[N]=O[N];}}if(!U&&0!==U){U=O.clientX||0;R=O.clientY||0;if(F.ie){U+=Math.max(P.documentElement.scrollLeft,T.scrollLeft);R+=Math.max(P.documentElement.scrollTop,T.scrollTop);}}this._yuifacade=true;this.pageX=U;this.pageY=R;Q=O.keyCode||O.charCode||0;if(F.webkit&&(Q in E)){Q=E[Q];}this.keyCode=Q;this.charCode=Q;this.button=O.which||O.button;this.which=this.button;this.details=I;this.time=O.time||new Date().getTime();this.target=(L)?O.target:H(O.target||O.srcElement);this.currentTarget=(L)?M:H(M);V=O.relatedTarget;if(!V){if(O.type=="mouseout"){V=O.toElement;}else{if(O.type=="mouseover"){V=O.fromElement;}}}this.relatedTarget=(L)?V:H(V);this.stopPropagation=function(){if(O.stopPropagation){O.stopPropagation();}else{O.cancelBubble=true;}if(J){J.stopPropagation();}};this.stopImmediatePropagation=function(){if(O.stopImmediatePropagation){O.stopImmediatePropagation();}else{this.stopPropagation();}if(J){J.stopImmediatePropagation();}};this.preventDefault=function(){if(O.preventDefault){O.preventDefault();}else{O.returnValue=false;}if(J){J.preventDefault();}};this.halt=function(W){if(W){this.stopImmediatePropagation();}else{this.stopPropagation();}this.preventDefault();};};})();(function(){var M=YUI.Env.add,H=YUI.Env.remove,K=function(){YUI.Env.windowLoaded=true;D.Event._load();H(window,"load",K);},E=function(){D.Event._unload();H(window,"unload",E);},F="domready",I="~yui|2|compat~",G="capture_",J=function(O){try{return(O&&typeof O!=="string"&&(O.length&&((!O.size)||(O.size()>1)))&&!O.tagName&&!O.alert&&(O.item||typeof O[0]!=="undefined"));}catch(N){return false;}},L=function(){var P=false,Q=0,O=[],R={},N=null,S={};return{POLL_RETRYS:1000,POLL_INTERVAL:40,lastError:null,_interval:null,_dri:null,DOMReady:false,startInterval:function(){var T=D.Event;if(!T._interval){T._interval=setInterval(D.bind(T._poll,T),T.POLL_INTERVAL);}},onAvailable:function(b,W,Z,Y,X,U){var T=D.Array(b),V;for(V=0;V<T.length;V=V+1){O.push({id:T[V],fn:W,obj:Z,override:Y,checkReady:X,compat:U});}Q=this.POLL_RETRYS;setTimeout(D.bind(D.Event._poll,D.Event),0);return new D.EventHandle();},onContentReady:function(X,U,W,V,T){return this.onAvailable(X,U,W,V,true,T);},attach:function(b,c,U,Y){U=U||D.config.win;var a=D.Array(arguments,0,true),f=a.slice(1),g,j=D.Event,i=false,h,X,V,e,d,T,W=false,Z;if(b.indexOf(G)>-1){b=b.substr(G.length);i=true;}if(f[f.length-1]===I){g=true;f.pop();}if(!c||!c.call){return false;}if(J(U)){h=[];D.each(U,function(m,l){a[2]=m;h.push(j.attach.apply(j,a));});return(h.length===1)?h[0]:h;}else{if(D.Lang.isString(U)){X=(g)?D.DOM.byId(U):D.Selector.query(U);if(X){if(D.Lang.isArray(X)){if(X.length==1){U=X[0];}else{a[2]=X;return j.attach.apply(j,a);}}else{U=X;}}else{return this.onAvailable(U,function(){j.attach.apply(j,a);},j,true,false,g);}}}if(!U){return false;}V=D.stamp(U);e="event:"+V+b;d=R[e];if(!d){d=D.publish(e,{bubbles:false});d.el=U;d.type=b;d.fn=function(k){d.fire(j.getEvent(k,U,g));};if(U==D.config.win&&b=="load"){d.fireOnce=true;N=e;if(YUI.Env.windowLoaded){W=true;}}R[e]=d;S[V]=S[V]||{};S[V][e]=d;M(U,b,d.fn,i);}T=f[2]||((g)?U:D.get(U));f[1]=T;f.splice(2,1);Z=d.subscribe.apply(d,f);if(W){d.fire();}return Z;},detach:function(a,c,V,W){var Z=D.Array(arguments,0,true),d,X,Y,b,T,U;if(Z[Z.length-1]===I){d=true;}if(a&&a.detach){return a.detach();}if(typeof V=="string"){V=(d)?D.DOM.byId(V):D.Selector.query(V);return D.Event.detach.apply(D.Event,Z);}else{if(J(V)){b=true;for(X=0,Y=V.length;X<Y;++X){Z[2]=V[X];b=(D.Event.detach.apply(D.Event,Z)&&b);}return b;}}if(!a||!c||!c.call){return this.purgeElement(V,false,a);}T="event:"+D.stamp(V)+a;U=R[T];if(U){return U.detach(c);}else{return false;}},getEvent:function(W,U,T){var V=W||window.event;return(T)?V:new D.DOMEventFacade(V,U,R["event:"+D.stamp(U)+W.type]);},generateId:function(T){var U=T.id;if(!U){U=D.stamp(T);T.id=U;}return U;},_isValidCollection:J,_load:function(T){if(!P){P=true;if(D.fire){D.fire(F);}D.Event._poll();}},_poll:function(){if(this.locked){return;}if(D.UA.ie&&!YUI.Env.DOMReady){this.startInterval();return;}this.locked=true;var Y=!P,X,Z,U,T,W,V;if(!Y){Y=(Q>0);}X=[];Z=function(c,d){var b,a=d.override;if(d.compat){if(d.override){if(a===true){b=d.obj;}else{b=a;}}else{b=c;}d.fn.call(b,d.obj);}else{b=d.obj||D.get(c);d.fn.apply(b,(D.Lang.isArray(a))?a:[]);}};for(U=0,T=O.length;U<T;++U){W=O[U];if(W&&!W.checkReady){V=(W.compat)?D.DOM.byId(W.id):D.Selector.query(W.id,null,true);if(V){Z(V,W);O[U]=null;}else{X.push(W);}}}for(U=0,T=O.length;U<T;++U){W=O[U];if(W&&W.checkReady){V=(W.compat)?D.DOM.byId(W.id):D.Selector.query(W.id,null,true);if(V){if(P||(V.get&&V.get("nextSibling"))||V.nextSibling){Z(V,W);O[U]=null;}}else{X.push(W);
}}}Q=(X.length===0)?0:Q-1;if(Y){this.startInterval();}else{clearInterval(this._interval);this._interval=null;}this.locked=false;return;},purgeElement:function(Y,Z,X){var V=(D.Lang.isString(Y))?D.Selector.query(Y,null,true):Y,U=this.getListeners(V,X),W,T;if(U){for(W=0,T=U.length;W<T;++W){U[W].detachAll();}}if(Z&&V&&V.childNodes){for(W=0,T=V.childNodes.length;W<T;++W){this.purgeElement(V.childNodes[W],Z,X);}}},getListeners:function(X,W){var Y=D.stamp(X,true),T=S[Y],V=[],U=(W)?"event:"+Y+W:null;if(!T){return null;}if(U){if(T[U]){V.push(T[U]);}}else{D.each(T,function(a,Z){V.push(a);});}return(V.length)?V:null;},_unload:function(U){var T=D.Event;D.each(R,function(W,V){W.detachAll();H(W.el,W.type,W.fn);delete R[V];});H(window,"load",T._load);H(window,"unload",T._unload);},nativeAdd:M,nativeRemove:H};}();D.Event=L;if(D.config.injected||YUI.Env.windowLoaded){K();}else{M(window,"load",K);}if(D.UA.ie){D.on(F,L._poll,L,true);}M(window,"unload",E);L.Custom=D.CustomEvent;L.Subscriber=D.Subscriber;L.Target=D.EventTarget;L.Handle=D.EventHandle;L.Facade=D.EventFacade;L._poll();})();D.Env.evt.plugins.available={on:function(G,F,I,H){var E=arguments.length>4?D.Array(arguments,4,true):[];return D.Event.onAvailable.call(D.Event,I,F,H,E);}};D.Env.evt.plugins.contentready={on:function(G,F,I,H){var E=arguments.length>4?D.Array(arguments,4,true):[];return D.Event.onContentReady.call(D.Event,I,F,H,E);}};(function(){var F=D.UA.ie?"focusin":"focus",G=D.UA.ie?"focusout":"blur",H="capture_",E=D.Env.evt.plugins;E.focus={on:function(){var I=D.Array(arguments,0,true);I[0]=H+F;return D.Event.attach.apply(D.Event,I);},detach:function(){var I=D.Array(arguments,0,true);I[0]=H+F;return D.Event.detach.apply(D.Event,I);}};E.blur={on:function(){var I=D.Array(arguments,0,true);I[0]=H+G;return D.Event.attach.apply(D.Event,I);},detach:function(){var I=D.Array(arguments,0,true);I[0]=H+G;return D.Event.detach.apply(D.Event,I);}};})();D.Env.evt.plugins.key={on:function(H,J,E,N,F){var L=D.Array(arguments,0,true),I,M,K,G;if(!N||N.indexOf(":")==-1){L[0]="keypress";return D.on.apply(D,L);}I=N.split(":");M=I[0];K=(I[1])?I[1].split(/,|\+/):null;G=(D.Lang.isString(E)?E:D.stamp(E))+N;G=G.replace(/,/g,"_");if(!D.getEvent(G)){D.on(H+M,function(S){var T=false,P=false,Q,O,R;for(Q=0;Q<K.length;Q=Q+1){O=K[Q];R=parseInt(O,10);if(D.Lang.isNumber(R)){if(S.charCode===R){T=true;}else{P=true;}}else{if(T||!P){T=(S[O+"Key"]);P=!T;}}}if(T){D.fire(G,S);}},E);}L.splice(2,2);L[0]=G;return D.on.apply(D,L);}};(function(){var F={},E=function(I,M){var L=M.target,K=F[I],H,J;for(H in K){if(K.hasOwnProperty(H)){J=K[H];M.currentTarget.queryAll(H).some(function(O,N){if(O.compareTo(L)||O.contains(L)){M.target=O;D.fire(J,M);return true;}});}}},G=D.cached(function(H){return H.replace(/[|,:]/g,"~");});D.Env.evt.plugins.delegate={on:function(L,N,J,H,P){if(!P){return false;}var M=(D.Lang.isString(J)?J:D.stamp(J)),K="delegate:"+M+H+G(P),I=H+M,O=D.Array(arguments,0,true);if(!(I in F)){F[I]={};D.on(H,function(Q){E(I,Q);},J);}F[I][P]=K;O[0]=K;O.splice(2,3);return D.on.apply(D,O);}};})();(function(){var F,E,H="window:resize",G=function(I){if(D.UA.gecko){D.fire(H,I);}else{if(E){E.cancel();}E=D.later(D.config.windowResizeDelay||40,D,function(){D.fire(H,I);});}};D.Env.evt.plugins.windowresize={on:function(K,J){if(!F){F=D.on("resize",G);}var I=D.Array(arguments,0,true);I[0]=H;return D.on.apply(D,I);}};})();var B=function(H,E,G,J,F){var I=false;if(!H.compareTo(E)&&!H.contains(E)){if(F&&!H.compareTo(J.currentTarget)){J.target=H;}D.fire(G,J);I=true;}return I;};var C=function(J,G,F){var E=J.relatedTarget,I=J.target,H=false;if(F){this.queryAll(F).each(function(K){if((!H)&&(K.compareTo(I)||K.contains(I))){H=B(K,E,G,J,F);}});}else{B(this,E,G,J);}};var A={on:function(L,K,J,H){var G=(L==="mouseenter")?"mouseover":"mouseout",I=L+":"+(D.Lang.isString(J)?J:D.stamp(J))+G+H,F=D.Array(arguments,0,true),E=D.Lang.isString(H)?H:null;if(!D.getEvent(I)){D.on(G,D.rbind(C,D.Node.get(J),I,E),J);}F[0]=I;if(E){F.splice(2,2);}else{F.splice(2,1);}return D.on.apply(D,F);}};D.Env.evt.plugins.mouseenter=A;D.Env.evt.plugins.mouseleave=A;},"@VERSION@",{requires:["event-custom"]});