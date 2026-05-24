(()=>{try{const xe=document.createElement("script");xe.src="https://browser.sentry-cdn.com/10.21.0/bundle.replay.min.js",xe.crossOrigin="anonymous",xe.onload=()=>{try{const ot=window.Sentry;if(ot?.init){ot.init({dsn:"https://5e3941022035f46e66baff253faad9dc@o40032.ingest.us.sentry.io/4508522669408256",integrations:[ot.replayIntegration({maskAllText:!1,maskAllInputs:!1,blockAllMedia:!1})],replaysSessionSampleRate:0,replaysOnErrorSampleRate:.1}),ot.setTag("source","preview-iframe");const Ae="mpdmfpod17G5Pz",Qe="malarvizhi19772020@gmail.com",Pt="69d72a02f3d166d7e2b352fb";Ae.startsWith("$$$")||ot.setTag("session_id",Ae),Qe.startsWith("$$$")||ot.setTag("user_email",Qe),Pt.startsWith("$$$")||ot.setTag("user_id",Pt)}}catch{}},document.head.appendChild(xe)}catch{}const e=xe=>{window.parent.postMessage(xe,"*"),console.log(xe)},t="__ANIMA_DBG__",r=console.log.bind(console),n=console.error.bind(console),i=[];let s=null;const a=[];let o=null;const l=xe=>{if(xe===void 0)return"undefined";if(xe===null)return"null";if(typeof xe=="string")return xe;if(xe instanceof Error)return`${xe.name}: ${xe.message}`;try{return JSON.stringify(xe,null,2)}catch{return String(xe)}},c=(xe,ot)=>{const Ae=`${xe}
${ot||""}`;return Ae.includes("chrome-extension://")||Ae.includes("moz-extension://")},u=(xe,ot,Ae)=>{const Qe=ot.map(l).join(" ").slice(0,2e3);c(Qe,Ae)||(i.push({level:xe,message:Qe,stack:Ae,timestamp:Date.now()}),i.length>50&&i.shift(),d())},d=()=>{s||(s=setTimeout(()=>{i.length>0&&(e({type:"console-errors",payload:{entries:[...i]}}),i.length=0),s=null},500))},p=xe=>{const ot=xe.map(l).join(" ").slice(0,1e3);ot.startsWith(t)&&(a.push({message:ot,timestamp:Date.now()}),a.length>120&&a.shift(),h())},h=()=>{o||(o=setTimeout(()=>{a.length>0&&(e({type:"runtime-debug-logs",payload:{entries:[...a]}}),a.length=0),o=null},300))};console.log=(...xe)=>{r(...xe),p(xe)},console.error=(...xe)=>{n(...xe),u("error",xe,new Error().stack)},window.addEventListener("error",xe=>{u("exception",[xe.message],xe.error?.stack)}),window.addEventListener("unhandledrejection",xe=>{const ot=xe.reason instanceof Error?xe.reason.message:String(xe.reason),Ae=xe.reason?.stack??"";u("unhandledrejection",[ot],Ae)});const g=async()=>window.html2canvas?window.html2canvas:new Promise((xe,ot)=>{const Ae=document.createElement("script");Ae.src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",Ae.onload=()=>{xe(window.html2canvas)},Ae.onerror=()=>{ot(new Error("Failed to load html2canvas"))},document.head.appendChild(Ae)});let y=window.location.pathname;e({type:"preview-navigate",payload:{destinationPathname:y}}),window.navigation&&window.navigation.addEventListener("currententrychange",()=>{const ot=new URL(window.navigation.currentEntry?.url??"").pathname;ot!==y&&window.scrollTo(0,0),y=ot,e({type:"preview-navigate",payload:{destinationPathname:ot}})}),window.document.querySelectorAll("a").forEach(xe=>xe.addEventListener("click",ot=>{const Qe=ot.currentTarget.getAttribute("href");if(!Qe||Qe.startsWith("#")||/^(https?:)?\/\//.test(Qe)||!Qe.endsWith(".html"))return;const Pt=new URL(Qe,window.location.href);e({type:"preview-navigate",payload:{destinationPathname:Pt.pathname}})}));let b;window.addEventListener("scroll",()=>{e({type:"preview-scroll"}),clearTimeout(b),b=setTimeout(()=>{e({type:"preview-scroll-stop",payload:{scrollX:window.scrollX,scrollY:window.scrollY}})},150)}),new MutationObserver(xe=>{for(const Ae of xe)for(const Qe of Ae.addedNodes)Qe instanceof HTMLIFrameElement&&Qe.style.position==="fixed"&&setTimeout(()=>{try{const Pt=Qe.contentDocument?.body?.textContent??"";(Pt.includes("chrome-extension://")||Pt.includes("moz-extension://"))&&Qe.remove()}catch{}},150);const ot=document.documentElement.querySelector("vite-error-overlay");if(ot?.shadowRoot){const Ae=ot.shadowRoot.querySelector('[part="message-body"]')?.textContent??"",Qe=Ae.split(": ")[1]?.split(/\(\d+:\d+\)/)[0],Pt=ot.shadowRoot.querySelector('[part="file"]')?.textContent??"",nr=ot.shadowRoot.querySelector('[part="frame"]')?.textContent??"";e({type:"on-preview-error",payload:{message:Qe||Ae,file:Pt,frame:nr}});const ir=ot.shadowRoot.querySelector('[part="tip"]');if(ir){const lr=document.createElement("button");lr.textContent="Try to fix",lr.onclick=()=>{e({type:"try-to-fix-preview-error",payload:{message:Qe||Ae,file:Pt,frame:nr}})},ir.replaceChildren(lr)}}}).observe(document,{attributes:!1,childList:!0,subtree:!0});const v=xe=>{const ot=new URL(xe,window.location.href),Ae=new URL(window.location.href);return ot.origin!==Ae.origin};if(document.addEventListener("click",xe=>{if(window._isSelectionAreaEnabled){xe.preventDefault(),xe.stopPropagation();return}const ot=xe.target?.closest("a");ot&&ot.href&&v(ot.href)&&(xe.preventDefault(),xe.stopPropagation(),e({type:"open-external-link",payload:{url:ot.href}}))},!0),!window._selectionArea){const xe=document.createElement("style");xe.textContent=`.selected {
  outline: 2px solid #9c7dff !important;
  background-color: rgba(156, 125, 255, 0.5) !important;
}

.hovered-pre-selected {
  outline: 2px solid #9c7dff !important;
  background-color: rgba(213, 205, 249, 0.5) !important;
}

.inline-selected {
  outline: 2px dashed #9c7dff !important;
  background-color: transparent !important;
}

.inline-hovered-pre-selected {
  outline: 2px solid #9c7dff;
  background-color: rgba(213, 205, 249, 0.3);
}

.inline-locked {
  outline: 2px solid #9c7dff !important;
  background-color: rgba(213, 205, 249, 0.3) !important;
  position: relative;
}

.inline-locked::before {
  content: 'Text linked to DB or code. Ask AI to edit.' !important;
  position: absolute !important;
  bottom: 100% !important;
  left: -2px !important;
  margin-bottom: 2px !important;
  background-color: #242424 !important;
  color: white !important;
  padding: 2px 6px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  border-radius: 2px !important;
  pointer-events: none !important;
  z-index: 10000 !important;
  white-space: nowrap !important;
  line-height: 1.2 !important;
  font-family:
    system-ui,
    -apple-system,
    sans-serif !important;
}


`,document.head.appendChild(xe),window._inspectorStyleElement=xe;const ot=document.createElement("script");ot.type="module",ot.textContent=`// @ts-nocheck
// This script is imported as raw text and injected into the preview iframe
// THIS SHOULD BE JS ONLY
(async () => {
  const { default: SelectionArea } = await import('https://cdn.jsdelivr.net/npm/@viselect/vanilla/dist/viselect.mjs');

  const HOSTED_ASSETS_CDN_URL = 'https://c.animaapp.com';

  // Extract hosted image URLs from an element and its descendants
  const extractHostedImageUrls = (element) => {
    const urls = [];

    // Check if the element itself is an img
    if (element.tagName === 'IMG') {
      const src = element.getAttribute('src');
      if (src?.startsWith(HOSTED_ASSETS_CDN_URL)) {
        urls.push(src);
      }
    }

    // Find all img descendants
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src?.startsWith(HOSTED_ASSETS_CDN_URL)) {
        urls.push(src);
      }
    });

    // Return deduplicated URLs
    return [...new Set(urls)];
  };

  const getNonDescendantElements = (elements) => {
    return elements.filter((element) => {
      // Check if any other element in the list is an ancestor of the current element.
      return !elements.some((otherElement) => {
        return otherElement !== element && otherElement.contains(element);
      });
    });
  };

  try {
    const selection = new SelectionArea({
      selectables: ['div', 'span', 'img', 'a', 'button', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'header'],
      boundaries: ['#animaInspectorOverlay'], // crucial to capture the whole scrollable area
      behaviour: {
        triggers: [0],
        intersect: 'cover',
      },
    })
      .on('beforestart', ({ event }) => {
        event.stopImmediatePropagation();
        event.preventDefault();
      })
      .on('start', ({ store, event }) => {
        // Stop click handlers on regular native buttons.
        event.stopImmediatePropagation();
        event.preventDefault();
        // Due to hover behavior, there could be an element with "selected" class that's not in the store. Clean it up as well.
        document
          .querySelectorAll('body .hovered-pre-selected')
          .forEach((el) => el.classList.remove('hovered-pre-selected'));
        if (!event.ctrlKey && !event.metaKey) {
          store.stored.forEach((el) => el.classList.remove('selected'));
          selection.clearSelection();

          window._selectionInProgress = true;
        }
      })
      .on(
        'move',
        ({
          store: {
            changed: { added, removed },
          },
        }) => {
          added.forEach((el) => el.classList.add('selected'));
          removed.forEach((el) => el.classList.remove('selected'));
        },
      )
      .on('stop', ({ store }) => {
        const nonDescendantElements = getNonDescendantElements(
          store.stored.filter((el) => !el.classList.contains('selection-area')),
        );

        // remove selected class from non-selected elements
        store.stored.forEach((el) => {
          if (!nonDescendantElements.includes(el)) {
            el.classList.remove('selected');
          }
        });

        const selectedElements = nonDescendantElements.map((el) => {
          return {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            textContent: el.textContent.length > 100 ? el.textContent.substring(0, 100) + '...' : el.textContent,
            parentTagName: el.parentElement?.tagName,
            hostedImageUrls: extractHostedImageUrls(el),
          };
        });

        // Store selecteionInProgress so we can inhibit our mouseover and mouseout event listeners (see below)
        window._selectionInProgress = false;

        const message = {
          type: 'inspector-state-changed',
          payload: {
            selectedElements,
            isInspectorEnabled: true,
          },
        };

        if (!window._isSelectionAreaEnabled) {
          return;
        }

        window.parent.postMessage(message, '*');

        console.log(message);
      });

    // Store the selection instance in the window object for later access
    window._selectionArea = selection;
    window._selectionInProgress = false;
    window._selectionArea.disable();

    // In case new elements get added to the DOM as we scroll
    window.addEventListener('scroll', () => {
      window._selectionArea?.resolveSelectables();
    });
  } catch (error) {
    console.error('Error initializing SelectionArea:', error);
  }
})();


// @ts-nocheck
// This script is imported as raw text and injected into the preview iframe
// THIS SHOULD BE JS ONLY

(async () => {
  const { default: SelectionArea } = await import('https://cdn.jsdelivr.net/npm/@viselect/vanilla/dist/viselect.mjs');

  const HOSTED_ASSETS_CDN_URL = 'https://c.animaapp.com';

  // Extract hosted image URLs from an element and its descendants
  const extractHostedImageUrls = (element) => {
    const urls = [];

    // Check if the element itself is an img
    if (element.tagName === 'IMG') {
      const src = element.getAttribute('src');
      if (src?.startsWith(HOSTED_ASSETS_CDN_URL)) {
        urls.push(src);
      }
    }

    // Find all img descendants
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src?.startsWith(HOSTED_ASSETS_CDN_URL)) {
        urls.push(src);
      }
    });

    // Return deduplicated URLs
    return [...new Set(urls)];
  };

  const getNonDescendantElements = (elements) => {
    return elements.filter((element) => {
      // Check if any other element in the list is an ancestor of the current element.
      return !elements.some((otherElement) => {
        return otherElement !== element && otherElement.contains(element);
      });
    });
  };

  function makeEditableAndFocus(element) {
    // Make the element content-editable
    element.contentEditable = 'true';

    // Focus the element
    element.focus();

    // Place cursor at the end of the content
    const range = document.createRange();
    const selection = window.getSelection();

    // If the element has child nodes, place cursor at the end
    if (element.childNodes.length > 0) {
      range.setStart(
        element.childNodes[element.childNodes.length - 1],
        element.childNodes[element.childNodes.length - 1]?.textContent?.length ?? 0,
      );
    } else {
      range.setStart(element, 0);
    }

    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  try {
    const inlineSelection = new SelectionArea({
      selectables: ['div', 'span', 'img', 'a', 'button', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'header'],
      boundaries: ['#animaInspectorOverlay'], // crucial to capture the whole scrollable area
      behaviour: {
        triggers: [0],
        intersect: 'cover',
      },
    })
      .on('beforestart', ({ event }) => {
        event.stopImmediatePropagation();
        event.preventDefault();
      })
      .on('start', ({ store, event }) => {
        // Stop click handlers on regular native buttons.
        event.stopImmediatePropagation();
        event.preventDefault();
        // Due to hover behavior, there could be an element with "selected" class that's not in the store. Clean it up as well.
        document
          .querySelectorAll('body .hovered-pre-selected')
          .forEach((el) => el.classList.remove('hovered-pre-selected'));
        if (!event.ctrlKey && !event.metaKey) {
          store.stored.forEach((el) => el.classList.remove('selected'));
          inlineSelection.clearSelection();

          window._selectionInProgress = true;
        }
      })
      .on(
        'move',
        ({
          store: {
            changed: { added, removed },
          },
        }) => {
          added.forEach((el) => el.classList.add('selected'));
          removed.forEach((el) => el.classList.remove('selected'));
        },
      )
      .on('stop', ({ store }) => {
        const nonDescendantElements = getNonDescendantElements(
          store.stored.filter((el) => !el.classList.contains('selection-area')),
        );

        // remove selected class from non-selected elements
        store.stored.forEach((el) => {
          if (!nonDescendantElements.includes(el)) {
            el.classList.remove('selected');
          }
        });

        const selectedElements = nonDescendantElements.map((el) => {
          return {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            textContent: el.textContent.length > 100 ? el.textContent.substring(0, 100) + '...' : el.textContent,
            parentTagName: el.parentElement?.tagName,
            hostedImageUrls: extractHostedImageUrls(el),
          };
        });

        // Store selecteionInProgress so we can inhibit our mouseover and mouseout event listeners (see below)
        window._selectionInProgress = false;

        const message = {
          type: 'inline-editor-state-changed',
          payload: {
            selectedElements,
            isInlineEditorEnabled: true,
          },
        };

        const el = nonDescendantElements[0];
        if (el) {
          makeEditableAndFocus(el);
        }

        window.parent.postMessage(message, '*');

        console.log(message);
      });

    // Store the selection instance in the window object for later access
    window._inlineSelectionArea = inlineSelection;
    window._selectionInProgress = false;
    window._inlineSelectionArea.disable();

    // In case new elements get added to the DOM as we scroll
    window.addEventListener('scroll', () => {
      window._inlineSelectionArea?.resolveSelectables();
    });
  } catch (error) {
    console.error('Error initializing _inlineSelectionArea:', error);
  }
})();
`,document.head.appendChild(ot),window._inspectorScriptElement=ot,window._isSelectionAreaEnabled=!1,window._isInlineSelectionAreaEnabled=!1,document.body&&(document.body.style.userSelect="unset"),e({type:"inspector-state-changed",payload:{selectedElements:[],isInspectorEnabled:!1}}),e({type:"inline-editor-state-changed",payload:{selectedElements:[],isInlineEditorEnabled:!1}})}let k=null,D=null;const F=["div","span","img","a","button","p","h1","h2","h3","h4","h5","h6","section","header"],R=xe=>{let ot=xe;for(;ot&&ot!==document.body;){if(F.includes(ot.tagName.toLowerCase()))return ot.closest("body")?ot:null;ot=ot.parentElement}return null},L=xe=>{if(window._selectionInProgress)return;const ot=R(xe.target);if(ot&&!ot.classList.contains("hovered-pre-selected")){if(window._selectionArea.getSelection().includes(ot))return;ot.classList.add("hovered-pre-selected")}},$=xe=>{if(window._selectionInProgress)return;const ot=R(xe.target);if(ot?.classList.contains("hovered-pre-selected")){if(window._selectionArea.getSelection().includes(ot))return;ot.classList.remove("hovered-pre-selected")}},G=(xe,ot)=>{ot.style.cssText=xe.style.cssText,ot.classList.add(...xe.classList),xe.classList="",xe.style.cssText=""},J=xe=>{xe.preventDefault()},te="data-anima-original-tw",H=["pointer-events-none"],ae=xe=>{const ot=xe.querySelectorAll("*");[xe,...Array.from(ot)].forEach(Ae=>{const Qe=H.filter(Pt=>Ae.classList.contains(Pt));Qe.length>0&&(Ae.setAttribute(te,Qe.join(" ")),Qe.forEach(Pt=>Ae.classList.remove(Pt)))})},X=xe=>{const ot=xe.querySelectorAll(`[${te}]`);(xe.hasAttribute(te)?[xe,...Array.from(ot)]:Array.from(ot)).forEach(Qe=>{const Pt=Qe.getAttribute(te);Pt&&(Pt.split(" ").forEach(nr=>Qe.classList.add(nr)),Qe.removeAttribute(te))})},we=xe=>{if(!(xe instanceof Element))return"";const ot=[];let Ae=xe;for(;Ae&&Ae.nodeType===1&&Ae!==document.documentElement;){const Qe=Ae.tagName.toLowerCase(),Pt=Ae.id?"#"+Ae.id:"",nr=Ae.classList&&Ae.classList.length>0?"."+Array.from(Ae.classList).join("."):"";let ir=Qe+Pt+nr;if(!Pt){const lr=Ae.parentElement;if(lr&&Array.from(lr.children).filter(je=>je.tagName===Ae.tagName).length>1){const je=Array.from(lr.children).indexOf(Ae)+1;ir+=`:nth-child(${je})`}}if(ot.unshift(ir),Ae=Ae.parentElement,Pt)break}return ot.join(" > ")},Fe=xe=>xe.trim(),he=xe=>{xe.contentEditable="plaintext-only",xe.style.caretColor="#ffffff",xe.focus();const ot=document.createRange(),Ae=window.getSelection();try{ot.selectNodeContents(xe),ot.collapse(!1),Ae?.removeAllRanges(),Ae?.addRange(ot)}catch(Qe){console.error("Failed to position caret:",Qe)}},_e="https://c.animaapp.com",Oe=xe=>{const ot=[];if(xe.tagName==="IMG"){const Qe=xe.getAttribute("src");Qe?.startsWith(_e)&&ot.push(Qe)}return xe.querySelectorAll("img").forEach(Qe=>{const Pt=Qe.getAttribute("src");Pt?.startsWith(_e)&&ot.push(Pt)}),[...new Set(ot)]},st=()=>{const xe=window._inlineEditorActiveEl;if(!xe)return null;const ot=window._inlineEditorOriginalText??"",Ae=xe.innerText??xe.textContent??"";xe.contentEditable="false";const Qe=Fe(ot),Pt=Fe(Ae);if(Qe===Pt)return window._inlineEditorActiveEl=null,window._inlineEditorOriginalText="",null;const nr={selector:we(xe),tagName:xe.tagName,id:xe.id,className:xe.className,beforeText:ot,afterText:Ae,dataUid:xe.getAttribute("data-uid")||void 0,fallbackFilePath:xe.getAttribute("data-inline-editor-file-path")||void 0,timestamp:Date.now()};return xe.removeAttribute("data-inline-editor-file-path"),window._inlineEditorEdits=Array.isArray(window._inlineEditorEdits)?window._inlineEditorEdits:[],window._inlineEditorEdits.push(nr),window._inlineEditorActiveEl=null,window._inlineEditorOriginalText="",nr},Le=xe=>{if(window._selectionInProgress)return;const ot=R(xe.target);if(ot&&!ot.classList.contains("inline-hovered-pre-selected")){const Ae=Array.from(ot.childNodes),Qe=Ae.some(nr=>nr.nodeType===Node.ELEMENT_NODE),Pt=Ae.some(nr=>nr.nodeType===Node.TEXT_NODE&&!!nr.textContent?.trim());if(Qe&&!Pt)return;ot.classList.add("inline-hovered-pre-selected")}},ze=xe=>{if(window._selectionInProgress)return;const ot=R(xe.target);ot?.classList.contains("inline-hovered-pre-selected")&&ot.classList.remove("inline-hovered-pre-selected")},He=xe=>{if(!window._isInlineSelectionAreaEnabled)return;const ot=R(xe.target);if(!ot||ot.tagName.toLowerCase()==="img"||(xe.target?.closest("a")&&(xe.preventDefault(),xe.stopPropagation()),window._inlineEditorActiveEl&&window._inlineEditorActiveEl!==ot&&(st(),window._inlineEditorActiveEl?.classList.remove("inline-selected")),window._inlineEditorActiveEl===ot))return;document.querySelectorAll(".inline-locked").forEach(Gt=>Gt.classList.remove("inline-locked"));const Qe=Array.from(ot.childNodes),Pt=Qe.some(Gt=>Gt.nodeType===Node.ELEMENT_NODE),nr=Qe.some(Gt=>Gt.nodeType===Node.TEXT_NODE&&!!Gt.textContent?.trim());if(Pt&&!nr||ot.classList.contains("inline-locked"))return;const ir=ot.getAttribute("data-uid");if(!ir){ot.classList.add("inline-locked");return}const lr=ot.innerText??ot.textContent??"";lr.trim()&&(window._pendingInlineElement=ot,e({type:"check-text-exists",payload:{text:lr.trim(),elementId:ir}}))},ft=(xe,ot,Ae,Qe)=>{const Pt=window._pendingInlineElement;if(!Pt||(Pt.getAttribute("data-uid")||"")!==(ot||""))return;if(window._pendingInlineElement=null,!xe){Pt.classList.add("inline-locked");return}Qe?Pt.setAttribute("data-inline-editor-file-path",Qe):Pt.removeAttribute("data-inline-editor-file-path"),window._inlineEditorActiveEl=Pt;const nr=Pt.innerText??Pt.textContent??"";window._inlineEditorOriginalText=nr,Pt.classList.add("inline-selected"),he(Pt);const ir=()=>{const je=st();if(Pt.classList.remove("inline-selected"),Pt.classList.remove("inline-locked"),Pt.removeEventListener("blur",ir,!0),je){const Be=Array.isArray(window._inlineEditorEdits)?window._inlineEditorEdits:[];e({type:"inline-editor-state-changed",payload:{selectedElements:[],isInlineEditorEnabled:!0,edits:Be,hasPendingEdits:!0}})}};Pt.addEventListener("blur",ir,!0);const lr=[{tagName:Pt.tagName,id:Pt.id,className:Pt.className,textContent:(Pt.textContent??"").length>100?(Pt.textContent??"").substring(0,100)+"...":Pt.textContent??"",parentTagName:Pt.parentElement?.tagName??"",hostedImageUrls:Oe(Pt)}],Gt=Array.isArray(window._inlineEditorEdits)?window._inlineEditorEdits:[];e({type:"inline-editor-state-changed",payload:{selectedElements:lr,isInlineEditorEnabled:!0,edits:Gt.length>0?Gt:void 0,hasPendingEdits:Gt.length>0}})},$t=()=>{document.addEventListener("mouseover",Le,!0),document.addEventListener("mouseout",ze,!0),document.addEventListener("click",He,!0)},pt=()=>{document.removeEventListener("mouseover",Le,!0),document.removeEventListener("mouseout",ze,!0),document.removeEventListener("click",He,!0),document.querySelectorAll("body .inline-hovered-pre-selected").forEach(xe=>xe.classList.remove("inline-hovered-pre-selected")),document.querySelectorAll("body .inline-selected").forEach(xe=>xe.classList.remove("inline-selected")),document.querySelectorAll("body .inline-locked").forEach(xe=>xe.classList.remove("inline-locked"))},mt=async()=>{const xe={removeScripts:!1,maxImportDepth:5,fetchCredentials:"include"},ot=document.baseURI,Ae=(tt,Ee)=>{try{return new URL(tt,Ee).href}catch{return tt}},Qe=()=>{const tt=document.doctype;if(!tt)return"";const Ee=tt.publicId?` PUBLIC "${tt.publicId}"`:"",Kt=!tt.publicId&&tt.systemId?" SYSTEM":"",zt=tt.systemId?` "${tt.systemId}"`:"";return`<!DOCTYPE ${tt.name}${Ee}${Kt}${zt}>`},Pt=(tt,Ee)=>tt.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,(Kt,zt,pe)=>{const Vt=pe.trim();return/^(data:|blob:|https?:|file:|#)/i.test(Vt)?Kt:`url("${Ae(Vt,Ee)}")`}),nr=async(tt,Ee,Kt,zt)=>{if(zt<=0)return tt;const pe=/@import\s+(?:url\(\s*)?(?:(["'])(.*?)\1|(.*?))(?:\s*\))?\s*([^;]*);/gi;let Vt="",tr=0,Se;for(;(Se=pe.exec(tt))!==null;){Vt+=tt.slice(tr,Se.index),tr=pe.lastIndex;const rt=Se[2],St=(Se[3]||"").trim(),dr=(Se[4]||"").trim(),hr=rt||St;if(!hr){Vt+=Se[0];continue}const $e=Ae(hr,Ee);if(Kt.has($e)){Vt+=`/* Skipped duplicate @import: ${$e} */
`;continue}Kt.add($e);try{const ie=await fetch($e,{credentials:xe.fetchCredentials});if(!ie.ok)throw new Error(`HTTP ${ie.status}`);let ve=await ie.text();ve=await nr(ve,$e,Kt,zt-1),ve=Pt(ve,$e),Vt+=dr?`
@media ${dr} {
${ve}
}
`:`
${ve}
`}catch(ie){console.warn("Could not inline @import:",$e,ie),Vt+=`@import url("${$e}") ${dr};
`}}return Vt+=tt.slice(tr),Vt},ir=async tt=>{try{if(tt&&tt.cssRules)return Array.from(tt.cssRules).map(Ee=>Ee.cssText).join(`
`)}catch{}if(tt&&tt.href)try{const Ee=await fetch(tt.href,{credentials:xe.fetchCredentials});if(!Ee.ok)throw new Error(`HTTP ${Ee.status}`);return await Ee.text()}catch(Ee){return console.warn("Could not fetch stylesheet:",tt.href,Ee),null}return""},lr=tt=>{const Ee=tt&&tt.ownerNode;return(Ee&&Ee.getAttribute&&Ee.getAttribute("media")||tt&&tt.media&&tt.media.mediaText||""||"").trim()},Gt=(tt,Ee)=>{const Kt=[["a","href"],["img","src"],["source","src"],["iframe","src"],["video","src"],["audio","src"],["track","src"],["form","action"],["script","src"],["link","href"]];for(const[zt,pe]of Kt)tt.querySelectorAll(`${zt}[${pe}]`).forEach(Vt=>{const tr=Vt.getAttribute(pe);tr&&(/^(data:|blob:|https?:|file:|mailto:|tel:|#)/i.test(tr)||Vt.setAttribute(pe,Ae(tr,Ee)))});tt.querySelectorAll("[srcset]").forEach(zt=>{const pe=zt.getAttribute("srcset");if(!pe)return;const Vt=pe.split(",").map(tr=>tr.trim()).filter(Boolean).map(tr=>{const Se=tr.split(/\s+/);return Se[0]=Ae(Se[0],Ee),Se.join(" ")});zt.setAttribute("srcset",Vt.join(", "))})},je=[],Be=new Set;for(const tt of Array.from(document.styleSheets)){const Ee=lr(tt),Kt=tt.href||ot;let zt=await ir(tt);zt===null?zt=`/* Could not inline stylesheet due to cross-origin restrictions: ${tt.href} */
@import url("${Ae(tt.href||"",ot)}");
`:(zt=await nr(zt,Kt,Be,xe.maxImportDepth),zt=Pt(zt,Kt)),je.push({cssText:zt,mediaText:Ee})}const de=document.documentElement.cloneNode(!0),z=document.implementation.createHTMLDocument(""),ee=z.importNode(de,!0);z.replaceChild(ee,z.documentElement);const Te=z.documentElement;let qe=Te.querySelector("head");if(qe||(qe=z.createElement("head"),Te.insertBefore(qe,Te.firstChild)),Te.querySelectorAll('link[rel~="stylesheet"], style').forEach(tt=>tt.remove()),Te.querySelectorAll("meta[http-equiv]").forEach(tt=>{(tt.getAttribute("http-equiv")||"").toLowerCase()==="content-security-policy"&&tt.remove()}),!qe.querySelector("base")){const tt=z.createElement("base");tt.href=ot,qe.insertBefore(tt,qe.firstChild)}for(const{cssText:tt,mediaText:Ee}of je){const Kt=z.createElement("style");Kt.setAttribute("data-inlined-by","extractHTML"),Ee&&Kt.setAttribute("media",Ee),Kt.appendChild(z.createTextNode(tt||"")),qe.appendChild(Kt)}return Gt(Te,ot),`${Qe()}
${Te.outerHTML}
`},Ne=xe=>{const ot=xe.tagName.toLowerCase(),Ae=xe.getAttribute("id"),Qe=xe.getAttribute("class")?.trim().split(/\s+/).slice(0,2).join(".");return Ae?`${ot}#${Ae}`:Qe?`${ot}.${Qe}`:ot},Xe=xe=>{const ot=window.getComputedStyle(xe),Ae=xe.getBoundingClientRect();return ot.display!=="none"&&ot.visibility!=="hidden"&&Ae.width>0&&Ae.height>0},Tt=xe=>{const ot=xe,Ae=xe.getAttribute("data-uid")||void 0,Qe=xe.getAttribute("id")||void 0,Pt=xe.getAttribute("class")||void 0;return{tagName:xe.tagName.toLowerCase(),textSnippet:(xe.textContent||"").replace(/\s+/g," ").trim().slice(0,160),selectorHint:Ne(xe),...Ae?{dataUid:Ae}:{},...Qe?{id:Qe}:{},...Pt?{className:Pt}:{},visible:ot instanceof HTMLElement?Xe(ot):!0}},jt=xe=>{const ot=typeof xe.selector=="string"?xe.selector:void 0,Ae=typeof xe.text=="string"?xe.text.trim():void 0,Qe=typeof xe.dataUid=="string"?xe.dataUid:void 0;return Qe?document.querySelector(`[data-uid="${CSS.escape(Qe)}"]`):ot?document.querySelector(ot):Ae?Array.from(document.querySelectorAll("body *")).find(Pt=>(Pt.textContent||"").replace(/\s+/g," ").includes(Ae)):null},dt=xe=>{const ot=[];let Ae=xe.parentElement;for(;Ae&&ot.length<5;){const Qe=window.getComputedStyle(Ae);ot.push({tagName:Ae.tagName.toLowerCase(),selectorHint:Ne(Ae),display:Qe.display,position:Qe.position,overflow:Qe.overflow}),Ae=Ae.parentElement}return ot},vt=(xe,ot)=>{const Ae=[];for(const Qe of Array.from(document.styleSheets)){let Pt;try{Pt=Qe.cssRules}catch{continue}if(Pt)for(const nr of Array.from(Pt)){if(!(nr instanceof CSSStyleRule))continue;try{if(!xe.matches(nr.selectorText))continue}catch{continue}const ir=ot.reduce((lr,Gt)=>{const je=nr.style.getPropertyValue(Gt);return je&&(lr[Gt]=je),lr},{});if(Object.keys(ir).length>0&&Ae.push({selector:nr.selectorText,declarations:ir,sourceHint:Qe.href||"inline stylesheet"}),Ae.length>=12)return Ae}}return Ae},fe=async xe=>{switch(xe.command){case"query-elements":{const ot=typeof xe.args.selector=="string"?xe.args.selector:void 0,Ae=typeof xe.args.text=="string"?xe.args.text.trim():void 0,Qe=typeof xe.args.limit=="number"?xe.args.limit:10;return{matches:(ot?Array.from(document.querySelectorAll(ot)):Array.from(document.querySelectorAll("body *")).filter(nr=>Ae?(nr.textContent||"").replace(/\s+/g," ").includes(Ae):!1)).slice(0,Qe).map(Tt)}}case"click-element":{const ot=jt(xe.args);if(!(ot instanceof HTMLElement))throw new Error("Element not found");return ot.click(),{ok:!0,clicked:!0,pathAfter:window.location.pathname}}case"inspect-element":{const ot=jt(xe.args);if(!(ot instanceof HTMLElement))throw new Error("Element not found");const Ae=Array.isArray(xe.args.properties)?xe.args.properties.filter(ir=>typeof ir=="string"):["color","background-color","display","position","width","height","overflow","z-index"],Qe=window.getComputedStyle(ot),Pt=ot.getBoundingClientRect(),nr=Pt.bottom<0||Pt.right<0||Pt.top>window.innerHeight||Pt.left>window.innerWidth;return{element:Tt(ot),computed:Object.fromEntries(Ae.map(ir=>[ir,Qe.getPropertyValue(ir)])),layout:{x:Pt.x,y:Pt.y,width:Pt.width,height:Pt.height,display:Qe.display,position:Qe.position,overflow:Qe.overflow,zIndex:Qe.zIndex,clipped:nr,offscreen:nr},ancestors:xe.args.includeAncestors===!1?void 0:dt(ot),matchedRules:xe.args.includeMatchedRules===!1?void 0:vt(ot,Ae),notes:[]}}case"evaluate-script":{const ot=xe.args.function,Ae=xe.args.elementSelectors;if(typeof ot!="string"||!ot.trim())throw new Error("function parameter is required and must be a non-empty string");const Pt=(Array.isArray(Ae)?Ae.filter(Be=>typeof Be=="string"):[]).map(Be=>{const de=document.querySelector(Be);if(!de)throw new Error(`No element found for selector: ${Be}`);return de}),nr=new Function(`return (${ot});`)();if(typeof nr!="function")throw new Error("function parameter must evaluate to a callable function");const ir=5e3;let lr;const Gt=await Promise.race([Promise.resolve(nr(...Pt)),new Promise((Be,de)=>{lr=window.setTimeout(()=>{de(new Error(`Script evaluation timed out after ${ir}ms`))},ir)})]).finally(()=>{lr!==void 0&&window.clearTimeout(lr)}),je=JSON.stringify(Gt);if(je===void 0)throw new Error("Script result is not JSON-serializable");return{ok:!0,result:je}}}};if(window.addEventListener("message",async xe=>{if(!(xe.data&&typeof xe.data=="object"&&xe.data.type)){console.log("event.data doesn't exist");return}const ot=xe.data,Ae=document.querySelector("body");switch(D=document.querySelector("#animaInspectorOverlay"),D||(D=document.createElement("div"),D.id="animaInspectorOverlay"),ot.type){case"on-sandpack-success":{history.replaceState({idx:0},"",window.location.href);break}case"navigate-back":{history.back();break}case"navigate-forward":{history.forward();break}case"navigate-to":{let{destinationPathname:Qe}=ot.payload;Qe&&!Qe.startsWith("/")&&(Qe="/"+Qe),Qe.endsWith(".html")?(window.location.href=Qe,e({type:"preview-navigate",payload:{destinationPathname:Qe}})):(history.pushState(null,Qe,Qe),window.dispatchEvent(new PopStateEvent("popstate")));break}case"toggle-inspector":{window._isSelectionAreaEnabled?(k?.append(...D.childNodes),k&&D&&G(D,k),Ae.removeChild(D),X(document.body),window._selectionArea.disable(),document.querySelectorAll(".selected").forEach(Qe=>Qe.classList.remove("selected")),window._selectionArea.clearSelection(),window._isSelectionAreaEnabled=!1,document.body&&(document.body.style.userSelect="unset"),e({type:"inspector-state-changed",payload:{selectedElements:[],isInspectorEnabled:!1}})):(ae(document.body),k=document.body.childElementCount===1?document.body.children[0]:document.querySelector("body"),D.append(...k?.childNodes||[]),k&&D&&G(k,D),Ae.appendChild(D),window._selectionArea.enable(),window._isSelectionAreaEnabled=!0,D?.addEventListener("click",J),D?.addEventListener("mouseover",L),D?.addEventListener("mouseout",$),document.body&&(document.body.style.userSelect="none"),e({type:"inspector-state-changed",payload:{selectedElements:[],isInspectorEnabled:!0}}));break}case"confirm-inline-edits":{try{(window._inlineEditorAssignedEls||[]).forEach(Pt=>Pt.removeAttribute("data-inline-editor-id"))}catch{}window._inlineEditorAssignedEls=[],window._inlineEditorEdits=[],window._inlineEditorActiveEl=null,window._inlineEditorOriginalText="";break}case"text-exists-result":{const{exists:Qe,elementId:Pt,totalOccurrences:nr,filePath:ir}=ot.payload;ft(Qe,Pt,nr,ir);break}case"toggle-inline-editor":{if(window._isInlineSelectionAreaEnabled){st(),document.querySelectorAll(".inline-selected").forEach(Pt=>{Pt.contentEditable="false",Pt.classList.remove("inline-selected")}),pt();const Qe=Array.isArray(window._inlineEditorEdits)?window._inlineEditorEdits:[];window._isInlineSelectionAreaEnabled=!1,document.body&&(document.body.style.userSelect="unset"),console.log("[inline-editor] Toggling off, edits:",Qe),e({type:"inline-editor-state-changed",payload:{selectedElements:[],isInlineEditorEnabled:!1,edits:Qe,hasPendingEdits:Qe.length>0}})}else window._inlineEditorEdits=[],window._inlineEditorActiveEl=null,window._inlineEditorOriginalText="",window._inlineEditorAssignedEls=[],window._isInlineSelectionAreaEnabled=!0,$t(),document.body&&(document.body.style.userSelect="unset"),e({type:"inline-editor-state-changed",payload:{selectedElements:[],isInlineEditorEnabled:!0}});break}case"take-screenshot":{if(!!document.querySelector("vite-error-overlay")){e({type:"screenshot-taken",payload:{imageData:null}});break}try{const ir=(await(await g())(document.body,{useCORS:!0,allowTaint:!1,scale:.5,logging:!1})).toDataURL("image/jpeg",.7);e({type:"screenshot-taken",payload:{imageData:ir}})}catch(Pt){console.error("Screenshot failed:",Pt),e({type:"screenshot-taken",payload:{imageData:null}})}break}case"restore-scroll-position":{const{scrollX:Qe,scrollY:Pt}=ot.payload,nr=5e3,ir=()=>{const je=Math.max(0,document.documentElement.scrollWidth-window.innerWidth),Be=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),de=Math.min(Qe,je),z=Math.min(Pt,Be),ee=de>0||z>0;return ee&&window.scrollTo({left:de,top:z,behavior:"smooth"}),ee};if(ir())break;const lr=new ResizeObserver(()=>{ir()&&(lr.disconnect(),clearTimeout(Gt))});lr.observe(document.documentElement);const Gt=setTimeout(()=>{lr.disconnect();const je=Math.max(0,document.documentElement.scrollWidth-window.innerWidth),Be=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),de=Math.min(Qe,je),z=Math.min(Pt,Be);(de>0||z>0)&&window.scrollTo({left:de,top:z,behavior:"smooth"})},nr);break}case"extract-html":{try{const Qe=await mt();e({type:"html-extracted",payload:{html:Qe}})}catch(Qe){console.error("HTML extraction failed:",Qe),e({type:"html-extracted",payload:{html:null}})}break}case"debug-command":{try{const Qe=await fe(ot.payload);e({type:"debug-command-result",payload:{requestId:ot.payload.requestId,ok:!0,result:Qe}})}catch(Qe){e({type:"debug-command-result",payload:{requestId:ot.payload.requestId,ok:!1,error:Qe instanceof Error?Qe.message:"Unknown debug command error"}})}break}}}),document.documentElement.setAttribute("ready","false"),new ResizeObserver(xe=>{for(const ot of xe)if(ot.target===document.documentElement){let Ae=document.documentElement.getAttribute("ready")==="true";const Qe=ot.contentRect.width,Pt=ot.contentRect.height;(Qe>0||Pt>0)&&!Ae&&(document.documentElement.setAttribute("ready","true"),Ae=!0),setTimeout(()=>{const nr=!!document.documentElement.querySelector("vite-error-overlay");e({type:"preview-resize",payload:{isReady:Ae,hasError:nr}})},500)}}).observe(document.documentElement),!window.anima){const xe=document.createElement("script");xe.src="https://unpkg.com/@animaapp/playground-sdk@0",document.head.appendChild(xe)}const kt="mpdmfpod17G5Pz";if(!kt.startsWith("$$$")&&!window.__ANIMA_PLAYGROUND_ID__){const xe=document.createElement("script");xe.textContent=`window.__ANIMA_PLAYGROUND_ID__ = "${kt}";`,document.head.appendChild(xe)}const it="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc3OTI2ODA2NSwianRpIjoiMjJlYjJiODMtNTY0NS00YmI2LWExNjktMTBkNmZhMjMzZDViIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiNjlkNzJhMDJmM2QxNjZkN2UyYjM1MmZiIiwibmJmIjoxNzc5MjY4MDY1LCJjc3JmIjoiN2Q5N2Q3OTctOGQ3NS00NTk0LThhNGItZWM5MWExMmQzZDA5IiwiZXhwIjoxODEwODA0MDY1fQ.Qk-CuiOGTcy6IQskBgSbGRp1yPelt0r6Nna75BD4ewA";if(!it.startsWith("$$$")&&!window.__ANIMA_TOKEN__){const xe=document.createElement("script");xe.textContent=`window.__ANIMA_TOKEN__ = "${it}";`,document.head.appendChild(xe)}const Ye="https://playground-api.animaapp.com";if(!Ye.startsWith("$$$")&&!window.__ANIMA_PLAYGROUND_API_BASE_URL__){const xe=document.createElement("script");xe.textContent=`window.__ANIMA_PLAYGROUND_API_BASE_URL__ = "${Ye}";`,document.head.appendChild(xe)}})()