YUI.add("anim-base",function(b){var c="running",n="startTime",l="elapsedTime",j="start",i="tween",m="end",d="node",k="paused",o="reverse",h="iterationCount",a=Number;var f={},e;b.Anim=function(){b.Anim.superclass.constructor.apply(this,arguments);b.Anim._instances[b.stamp(this)]=this;};b.Anim.NAME="anim";b.Anim._instances={};b.Anim.RE_DEFAULT_UNIT=/^width|height|top|right|bottom|left|margin.*|padding.*|border.*$/i;b.Anim.DEFAULT_UNIT="px";b.Anim.DEFAULT_EASING=function(q,p,s,r){return s*q/r+p;};b.Anim._intervalTime=20;b.Anim.behaviors={left:{get:function(q,p){return q._getOffset(p);}}};b.Anim.behaviors.top=b.Anim.behaviors.left;b.Anim.DEFAULT_SETTER=function(s,t,v,w,y,r,u,x){var q=s._node,p=u(y,a(v),a(w)-a(v),r);if(t in q._node.style||t in b.DOM.CUSTOM_STYLES){x=x||"";q.setStyle(t,p+x);}else{if(q._node.attributes[t]){q.setAttribute(t,p);}else{q.set(t,p);}}};b.Anim.DEFAULT_GETTER=function(r,p){var q=r._node,s="";if(p in q._node.style||p in b.DOM.CUSTOM_STYLES){s=q.getComputedStyle(p);}else{if(q._node.attributes[p]){s=q.getAttribute(p);}else{s=q.get(p);}}return s;};b.Anim.ATTRS={node:{setter:function(p){p=b.one(p);this._node=p;if(!p){}return p;}},duration:{value:1},easing:{value:b.Anim.DEFAULT_EASING,setter:function(p){if(typeof p==="string"&&b.Easing){return b.Easing[p];}}},from:{},to:{},startTime:{value:0,readOnly:true},elapsedTime:{value:0,readOnly:true},running:{getter:function(){return !!f[b.stamp(this)];},value:false,readOnly:true},iterations:{value:1},iterationCount:{value:0,readOnly:true},direction:{value:"normal"},paused:{readOnly:true,value:false},reverse:{value:false}};b.Anim.run=function(){var q=b.Anim._instances;for(var p in q){if(q[p].run){q[p].run();}}};b.Anim.pause=function(){for(var p in f){if(f[p].pause){f[p].pause();}}b.Anim._stopTimer();};b.Anim.stop=function(){for(var p in f){if(f[p].stop){f[p].stop();}}b.Anim._stopTimer();};b.Anim._startTimer=function(){if(!e){e=setInterval(b.Anim._runFrame,b.Anim._intervalTime);}};b.Anim._stopTimer=function(){clearInterval(e);e=0;};b.Anim._runFrame=function(){var p=true;for(var q in f){if(f[q]._runFrame){p=false;f[q]._runFrame();}}if(p){b.Anim._stopTimer();}};b.Anim.RE_UNITS=/^(-?\d*\.?\d*){1}(em|ex|px|in|cm|mm|pt|pc|%)*$/;var g={run:function(){if(this.get(k)){this._resume();}else{if(!this.get(c)){this._start();}}return this;},pause:function(){if(this.get(c)){this._pause();}return this;},stop:function(p){if(this.get(c)||this.get(k)){this._end(p);}return this;},_added:false,_start:function(){this._set(n,new Date()-this.get(l));this._actualFrames=0;if(!this.get(k)){this._initAnimAttr();}f[b.stamp(this)]=this;b.Anim._startTimer();this.fire(j);},_pause:function(){this._set(n,null);this._set(k,true);delete f[b.stamp(this)];this.fire("pause");},_resume:function(){this._set(k,false);f[b.stamp(this)]=this;this._set(n,new Date()-this.get(l));b.Anim._startTimer();this.fire("resume");},_end:function(p){var q=this.get("duration")*1000;if(p){this._runAttrs(q,q,this.get(o));}this._set(n,null);this._set(l,0);this._set(k,false);delete f[b.stamp(this)];this.fire(m,{elapsed:this.get(l)});},_runFrame:function(){var u=this._runtimeAttr.duration,r=new Date()-this.get(n),q=this.get(o),p=(r>=u),s,v;this._runAttrs(r,u,q);this._actualFrames+=1;this._set(l,r);this.fire(i);if(p){this._lastFrame();}},_runAttrs:function(A,z,w){var x=this._runtimeAttr,r=b.Anim.behaviors,y=x.easing,p=z,u=false,q,s,v;if(A>=z){u=true;}if(w){A=z-A;p=0;}for(v in x){if(x[v].to){q=x[v];s=(v in r&&"set" in r[v])?r[v].set:b.Anim.DEFAULT_SETTER;if(!u){s(this,v,q.from,q.to,A,z,y,q.unit);}else{s(this,v,q.from,q.to,p,z,y,q.unit);}}}},_lastFrame:function(){var p=this.get("iterations"),q=this.get(h);q+=1;if(p==="infinite"||q<p){if(this.get("direction")==="alternate"){this.set(o,!this.get(o));}this.fire("iteration");}else{q=0;this._end();}this._set(n,new Date());this._set(h,q);},_initAnimAttr:function(){var w=this.get("from")||{},v=this.get("to")||{},p={duration:this.get("duration")*1000,easing:this.get("easing")},r=b.Anim.behaviors,u=this.get(d),t,s,q;b.each(v,function(A,y){if(typeof A==="function"){A=A.call(this,u);}s=w[y];if(s===undefined){s=(y in r&&"get" in r[y])?r[y].get(this,y):b.Anim.DEFAULT_GETTER(this,y);}else{if(typeof s==="function"){s=s.call(this,u);}}var x=b.Anim.RE_UNITS.exec(s);var z=b.Anim.RE_UNITS.exec(A);s=x?x[1]:s;q=z?z[1]:A;t=z?z[2]:x?x[2]:"";if(!t&&b.Anim.RE_DEFAULT_UNIT.test(y)){t=b.Anim.DEFAULT_UNIT;}if(!s||!q){b.error('invalid "from" or "to" for "'+y+'"',"Anim");return;}p[y]={from:s,to:q,unit:t};},this);this._runtimeAttr=p;},_getOffset:function(q){var s=this._node,t=s.getComputedStyle(q),r=(q==="left")?"getX":"getY",u=(q==="left")?"setX":"setY";if(t==="auto"){var p=s.getStyle("position");if(p==="absolute"||p==="fixed"){t=s[r]();s[u](t);}else{t=0;}}return t;},destructor:function(){delete b.Anim._instances[b.stamp(this)];}};b.extend(b.Anim,b.Base,g);},"@VERSION@",{requires:["base-base","node-style"]});