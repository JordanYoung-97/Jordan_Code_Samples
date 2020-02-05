/*global THREE, requestAnimationFrame, Detector, dat */
			THREE.ShaderTypes = {

			'phongDiffuse' : {

				uniforms: {

					"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
					"uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },

					"uMaterialColor":  { type: "c", value: new THREE.Color( 0xffffff ) },
          
          "uTime": { type: "f", value: 0.0 },
          "uNoiseTurb": { type: "f", value: 30.0 },
          "uNoiseWob": { type: "f", value: 15.0 },
          
          "u_Texture": { type: "t", value: null },

					uKd: {
						type: "f",
						value: 0.7
					},
					uBorder: {
						type: "f",
						value: 0.4
					}
				},
				vertexShader: [
        	"#include <noise>",
					
          "uniform float uTime;",
          "uniform float uNoiseTurb;",
          "uniform float uNoiseWob;",
          
					"varying vec3 vNormal;",
					"varying vec3 vViewPosition;",
					"varying float vNoise;",
          "varying vec2 vUv;",

					"void main() {",
							
              "vUv = uv;",
						  // add time to the noise parameters so it's animated
  						"vNoise = uNoiseTurb *  -.50 * turbulence( .9 * normal + uTime );",
              "float b = uNoiseWob * pnoise( 0.05 * position + vec3( 2.0 * uTime ), vec3( 100.0 ) );",
							// compose both noises
							"float displacement = - vNoise + b;",
  						// move the position along the normal and transform it
  						"vec3 pos = position + normal * displacement;",
						
  					"gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );",
						"vNormal = normalize( normalMatrix * normal );",
						"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
						"vViewPosition = -mvPosition.xyz;",

					"}"

				].join("\n"),
        
				fragmentShader: [

					"uniform vec3 uMaterialColor;",

					"uniform vec3 uDirLightPos;",
					"uniform vec3 uDirLightColor;",

					"uniform float uKd;",
					"uniform float uBorder;",
          
          "uniform float uTime;",

					"varying vec3 vNormal;",
					"varying vec3 vViewPosition;",
          
          "uniform sampler2D u_Texture;",
          "varying vec2 vUv;",

					"void main() {",

						// compute direction to light
						"vec4 lDirection = viewMatrix * vec4( uDirLightPos, 0.0 );",
						"vec3 lVector = normalize( lDirection.xyz );",

						// diffuse: N * L. Normal must be normalized, since it's interpolated.
						"vec3 normal = normalize( vNormal );",
						//was: "float diffuse = max( dot( normal, lVector ), 0.0);",
						// solution
						"float diffuse = dot( normal, lVector );",
						"if ( diffuse > 0.6 ) { diffuse = 1.0; }",
						"else if ( diffuse > -0.2 ) { diffuse = 0.7; }",
						"else { diffuse = 0.3; }",
            "vec4 mapTexel = texture2D( u_Texture, vUv.xy );",

						"gl_FragColor = vec4( uKd * uDirLightColor * diffuse, 1.0 ) * mapTexel;",

					"}"

				].join("\n")

			}

			};
      
// THREE CODE

			var SCREEN_WIDTH;
			var SCREEN_HEIGHT;

			var container, camera, scene, renderer, content;
      var pos;
      var project01;
			var clock = new THREE.Clock();
      var start = Date.now();
      var mouse = {x: 0, y: 0};
      var noise = {x:30, y:15};

			var ambientLight, light;
			var mesh, sphere;
			var phongMaterial, slideTrans;
      var texture0, texture1, texture2, texture3, texture4;
      var textures = []; 

			init();
			animate();
      
function init() {

				container = document.getElementById('container');
        content = document.getElementById('content');
        project01 = document.getElementById('project-01');
        SCREEN_WIDTH = container.clientWidth;
        SCREEN_HEIGHT = container.clientHeight;
        
				// CAMERA

				camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 80000);
				camera.position.set(0, 0, 100);
        camera.target = new THREE.Vector3(0, 0, 0);

				// SCENE

				scene = new THREE.Scene();
				scene.background = null;
				scene.add(camera);

				// LIGHTS

				ambientLight = new THREE.AmbientLight(0x333333); // 0.2
				scene.add(ambientLight);
				light = new THREE.DirectionalLight(0xffffff, 1.0);
				light.position.set(320, 390, 500);
				scene.add(light);

				// RENDERER
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
				renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				container.appendChild(renderer.domElement);
				renderer.gammaInput = true;
				renderer.gammaOutput = true;

				// EVENTS

				window.addEventListener('resize', onWindowResize, false);
				window.addEventListener('mousemove', onMouseMove, false);
        
				// MATERIALS
        texture0 = new THREE.TextureLoader().load("https://res.cloudinary.com/youngdesin/image/upload/v1569168137/Artboard_1.png" );
				texture1 = new THREE.TextureLoader().load("https://res.cloudinary.com/youngdesin/image/upload/v1565902787/candytexture.png");
				texture2 = new THREE.TextureLoader().load("https://res.cloudinary.com/youngdesin/image/upload/v1565729376/texturecandylab.png");
        texture3 = new THREE.TextureLoader().load("https://res.cloudinary.com/youngdesin/image/upload/v1565645592/14df54bbbda2874de8330bd18e54e7ef.jpg");
        texture4 = new THREE.TextureLoader().load("https://res.cloudinary.com/youngdesin/image/upload/v1565703521/candylabTexture.png");
        textures = [texture0, texture1, texture2, texture3, texture4];
        
        phongMaterial = createShaderMaterial("phongDiffuse", light);
        phongMaterial.uniforms[ 'u_Texture' ].value = texture0;
        //phongMaterial.uniforms[ 'uNoiseTurb' ].value = 15.0;
				phongMaterial.side = THREE.DoubleSide;
        
				const geometry = new THREE.IcosahedronGeometry(24, 6)
				mesh = new THREE.Mesh( geometry, phongMaterial );
        
        var geometrySphere = new THREE.SphereGeometry( 32, 32, 32 );
				var material = new THREE.MeshBasicMaterial( {color: 0x000000} );
				sphere = new THREE.Mesh( geometrySphere, material );
        sphere.position.z = -30;
        sphere.scale.x = 0.00001;
        sphere.scale.y = 0.00001;
				scene.add(mesh, sphere);
        
 slideTrans = anime.timeline({loop: false})
  .add({
    targets: mesh.position,
    y: 31,
    easing: "easeOutQuint",
    duration: 700,
    complete: function(anim) {
    slideInActive = true;
  	}
  })
  .add({
    targets: mesh.position,
    y: 0,
    easing: "easeOutQuint",
    duration: 700,
    complete: function(anim) {
    slideInActive = false;
  	}
  });
}

 function onMouseMove(event) {
 // Make the sphere follow the mouse
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
 
 
 function createShaderMaterial(id, light) {

	var shader = THREE.ShaderTypes[id];
	var u = THREE.UniformsUtils.clone(shader.uniforms);
	var vs = shader.vertexShader;
	var fs = shader.fragmentShader;
  var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;

	return material;

}
      
// EVENT HANDLERS

function onWindowResize() {

	SCREEN_WIDTH = container.clientWidth;
	SCREEN_HEIGHT = container.clientHeight;

	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

}

function animate() {

	requestAnimationFrame(animate);
	render();
  //ThreeMouseOver();
}

      
function render() {
  
  if(playSlide){
  	slideTrans.play();
    playSlide = false;
  }
  
  if(slideInActive && !CLICKED){
  phongMaterial.uniforms[ 'u_Texture' ].value = textures[index];
  }
  
  phongMaterial.uniforms[ 'uTime' ].value = .00005 * ( Date.now() - start );
  phongMaterial.uniforms['uNoiseTurb'].value = noise.y;
  phongMaterial.uniforms['uNoiseWob'].value = noise.x;
	
  //click Three D Object
  
  if(CLICKED && !slideActive){
		anime.timeline({loop: false})
  .add({
    targets: mesh.scale,
    x: 6,
    y: 6,
    easing: "easeOutQuint",
    delay: 600,
    duration: 1520
  });
  	CLICKED = false;
  }
  
  //mouseOver Three Dimentional Object
  if(THREEMOUSEOVER && !slideActive && !clickActive){
  	TweenMax.to(noise, 0.62, {
		x: 0,
  	ease: Back.easeOut
		});
    TweenMax.to(noise, 0.62, {
		y: 0,
  	ease: Back.easeOut
		});
   anime.timeline({loop: false})
  .add({
    targets: sphere.scale,
    x: 1,
    y: 1,
    easing: "easeOutQuint",
    duration: 141
  });
  } else {
  	TweenMax.to(noise, 0.62, {
		x: 15,
  	ease: Back.easeOut
		});
    TweenMax.to(noise, 0.62, {
		y: 30,
  	ease: Back.easeOut
		});
    anime.timeline({loop: false})
  .add({
    targets: sphere.scale,
    x: 0.00001,
    y: 0.00001,
    easing: "easeOutQuint",
    duration: 141
  });
	}

	renderer.render(scene, camera);
}

/*Information Index.*/
var titles = ['candylab','cntrl', 'parsons', 'space fighter', 'chef-a-thon'];
var candySubText = ['web development', 'web design', '3D modeling', 'unity', 'shopify', 'Ecommerce', 'Blender', 'Cinema4D', 'Model Making', 'product development', 'web development', 'web design', '3D modeling', 'unity', 'shopify', 'Ecommerce', 'Blender', 'Cinema4D', 'Model Making', 'product development'];
var cntrlSubText = ['video game development', 'video game design', '3D modeling', 'unity', 'ui / ux', 'video game design', 'video game development', '3D Modeling', 'unity', 'ui / ux', 'video game development', 'video game design', '3D modeling', 'unity', 'ui / ux', 'video game design', 'video game development', '3D Modeling', 'unity', 'ui / ux'];
var parsonsSubText = ['web development', 'web design', 'thesis', 'product development', 'model making', 'video game design', 'web development', 'web design', 'thesis', 'product development', 'web development', 'web design', 'thesis', 'product development', 'model making', 'video game design', 'web development', 'web design', 'thesis', 'product development'];
var spaceSubText = ['video game development', 'video game design', '2D Art', 'unity', 'computer science', 'video game design', 'video game development', '3D Art', 'unity', 'computer science', 'video game development', 'video game design', '2D Art', 'unity', 'computer science', 'video game design', 'video game development', '3D Art', 'unity', 'computer science'];
var cookSubText = ['video game development', 'video game design', 'Digital Card Game', 'unity', 'ui / ux', 'video game design', 'video game development', 'Digital Card Game', 'unity', 'ui / ux', 'video game development', 'video game design', 'Digital Card Game', 'unity', 'ui / ux', 'video game design', 'video game development', 'Digital Card Game', 'unity', 'ui / ux'];
var textTitles;
var subText;
var textMiddle = $("#middle");
var textBottom = $("#bottom");
var viewButton = $("#view-button");

/*3D Model Noise Var for Animation*/
var Blob = {bNoise:0};

/*STATES*/
var slideActive = false;
var	slideInActive = false;
var	playSlide = false;
var CLICKED = false;
var clickActive = false;
var INTERSECTED;
var THREEMOUSEOVER, project;
var index;
var caseLink;

function moveText(e) {
const { innerWidth: width, innerHeight: height } = window
let {offsetX: x, offsetY: y } = e

if(this !== e.target) {
x = x + e.target.offsetLeft;
y = y + e.target.offsetTop;
}

const movement = 20;
const bMovement = 40;
const xmMovement = (x / width * movement) - (movement / 2);
const ymMovement = (y / height * movement) - (movement / 2);
const xbMovement = (x / width * bMovement) - (bMovement / 2);
const ybMovement = (y / height * bMovement) - (bMovement / 2);

TweenMax.to(textMiddle, 0.5, {
	css: {
    left: xmMovement,
    top: ymMovement
  },
  ease: Back.easeOut
});

TweenMax.to(textBottom, 1, {
  css: {
    left: xbMovement,
    top: ybMovement
  },
  ease: Back.easeOut
});
}

function firstSlideTitle() {
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[0];
    }
    
for (var i = 0; i < subText.length; i++) { 
  	subText[i].innerHTML = candySubText[i];
}

caseLink.href = '#';

  textWrapTitle();
  anime({
  targets: '#outline, #bottom',
  borderColor:'#ff675e',
  easing: 'easeInOutSine'
});
anime({
  targets: '#bottom',
  color:'#ff675e',
  easing: 'easeInOutSine'
});
anime({
  targets: '#p-bot',
  background:'#ff675e',
  easing: 'easeInOutSine'
});
}

function secondSlideTitle() {
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[1];
    }
    
for (var i = 0; i < subText.length; i++) { 
  	subText[i].innerHTML = cntrlSubText[i];
}  

caseLink.href = '#';

  textWrapTitle();
    anime({
  targets: '#outline',
  borderColor:'#FFEEB0',
  easing: 'easeInOutSine'
});
anime({
  targets: '#bottom',
  color:'#FFEEB0',
  easing: 'easeInOutSine'
});
anime({
  targets: '#p-bot',
  background:'#FFEEB0',
  easing: 'easeInOutSine'
});
}

function thirdSlideTitle() {
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[2];
  }
    for (var i = 0; i < subText.length; i++) { 
        subText[i].innerHTML = parsonsSubText[i];
    } 

    caseLink.href = '#';

  textWrapTitle();
    anime({
  targets: '#outline',
  borderColor:'#e82e21',
  easing: 'easeInOutSine'
});
anime({
  targets: '#bottom',
  color:'#e82e21',
  easing: 'easeInOutSine'
});
anime({
  targets: '#p-bot',
  background:'#e82e21',
  easing: 'easeInOutSine'
});
}

function fourthSlideTitle() {
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[3];
    }
    
    for (var i = 0; i < subText.length; i++) { 
        subText[i].innerHTML = spaceSubText[i];
  } 

  caseLink.href = '#';

  textWrapTitle();
    anime({
  targets: '#outline',
  borderColor:'#590776',
  easing: 'easeInOutSine'
});
anime({
  targets: '#bottom',
  color:'#590776',
  easing: 'easeInOutSine'
});
anime({
  targets: '#p-bot',
  background:'#590776',
  easing: 'easeInOutSine'
});
}

function fifthSlideTitle() {
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[4];
	}
  
  for (var i = 0; i < subText.length; i++) {
    subText[i].innerHTML = cookSubText[i];
  }

  caseLink.href = '#';

  textWrapTitle();
  anime({
  targets: '#outline',
  borderColor:'#1CA421',
  easing: 'easeInOutSine'
});
anime({
  targets: '#bottom',
  color:'#1CA421',
  easing: 'easeInOutSine'
});
anime({
  targets: '#p-bot',
  background:'#1CA421',
  easing: 'easeInOutSine'
});
}

/*init for page content.*/
function initOnLoad(){
/*initialize variables*/
index = 0;
CLICKED = false;
clickActive = false;
textTitles = document.getElementsByClassName('title-text');
subText = document.getElementsByClassName('carousel-letters');
caseLink = document.getElementById('case-link');
console.log(subText);
project = $("#p-trig");
projectContent00 = document.getElementById('project-content-candy');
projectContent01 = document.getElementById('project-content-cntrl');
projectContent02 = document.getElementById('project-content-parsons');
projectContent03 = document.getElementById('project-content-star');
projectContent04 = document.getElementById('project-conten-cook');
projectContent05 = document.getElementById('project-content-contact');

/*Init Text and SubText Titles.*/
  for (var i = 0; i < textTitles.length; i++) { 
  	textTitles[i].innerHTML = titles[0];
	}
  
  for (var i = 0; i < subText.length; i++) { 
  	subText[i].innerHTML = candySubText[i];
  }
  
  
  /*wrap title after the text init*/
  textWrapTitle();
  
  var textWrapper04 = document.querySelector('#case-link');
  textWrapper04.innerHTML = textWrapper04.textContent.replace(/\S/g, "<span class='letter'>$&</span>");


  anime({
        targets: '.carousel-text',
        translateY: [-100 , 0],
        easing: "easeOutQuint",
        duration: 520,
        delay: (el, i) => 50 * i
  }, 320);
  
  anime.timeline({loop: false})
  .add({
    targets: '#top .letter',
    translateY: [1000 , 0],
    easing: "easeOutQuint",
    duration: 520,
    delay: (el, i) => 50 * i
  })
  .add({
    targets: '#bottom .letter',
    translateY: [1000 , 0],
    easing: "easeOutQuint",
    duration: 520,
    delay: (el, i) => 50 * i
  }, 0)
  .add({
    targets: '#middle .letter',
    translateY: [1000 , 0],
    easing: "easeOutQuint",
    duration: 520,
    delay: (el, i) => 50 * i
  }, 0);
}

/*event funtion when project is clicked.*/
function clickedProject() {
if(!CLICKED){
 setTimeout(function(){
     $(document.body).css("position", "absolute");
     $(document.body).css("overflow-y", "auto");
     $("#x-button-container").css('opacity', '1');
     caseLink.innerHTML = 'back to projects';
     var textWrapper04 = document.querySelector('#case-link');
     textWrapper04.innerHTML = textWrapper04.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
     var Scrollbar = window.Scrollbar;
     Scrollbar.init(document.querySelector('#main'), { 
      damping: 0.08,
     renderByPixels: false
    });
    console.log(index);
 }, 520);
 
  CLICKED = true;
  clickActive = true;
  	anime.timeline({loop: false})
	  .add({
    targets: '#showcase',
    bottom: '27vh',
    easing: "easeOutQuint",
    duration: 1520
  });
   anime.timeline().add({
    targets: '.sliding-block.yellow',
		bottom: '63vh',
		easing: "easeOutQuint",
    duration: 1420
  });

  setTimeout(function(){
    if(index == 0){
        $("#project-content-candy").css('display', 'flex');
        console.log(index + "clicked");
      anime({
         targets: '#project-content-candy',
         translate: [1000, 0],
         opacity: [0, 1],
         easing: "easeOutQuint",
         duration: 220,
       });
     }
     if(index == 1){
       $("#project-content-cntrl").css('display', 'flex');
       anime({
          targets: '#project-content-cntrl',
          translate: [1000, 0],
          opacity: [0, 1],
          easing: "easeOutQuint",
          duration: 220,
        });
      }
      if(index == 2){
       $("#project-content-parsons").css('display', 'flex');
       anime({
          targets: '#project-content-parsons',
          translate: [1000, 0],
          opacity: [0, 1],
         easing: "easeOutQuint",
         duration: 220,
        });
      }
      if(index == 3){
       $("#project-content-star").css('display', 'flex');
       anime({
          targets: '#project-content-star',
          translate: [1000, 0],
          opacity: [0, 1],
          easing: "easeOutQuint",
          duration: 220,
        });
      }
      if(index == 4){
       $("#project-content-cook").css('display', 'flex');
       anime({
          targets: '#project-content-cook',
          translate: [1000, 0],
          opacity: [0, 1],
         easing: "easeOutQuint",
         duration: 220,
        });
      }
  }, 520);
}else{
setTimeout(function(){
    $(document.body).css("position", "fixed");
    $(document.body).css("overflow-y", "hidden");
    Scrollbar.destroyAll()
}, 500);

const scrollBar = Scrollbar.getAll();
anime({
    targets: scrollBar,
    scrollTop: 0,
    duration: 500,
    easing: 'easeOutQuint'
});

 CLICKED = false;
 clickActive = false;
 caseLink.innerHTML = 'view case study';
 var textWrapper04 = document.querySelector('#case-link');
 textWrapper04.innerHTML = textWrapper04.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
 $("#x-button-container").css('opacity', '0');

  anime.timeline({loop: false})
    .add({
   targets: '#showcase',
   bottom: '0vh',
   easing: "easeOutQuint",
   duration: 1520
 });
  anime.timeline().add({
   targets: '.sliding-block.yellow',
       bottom: '0vh',
       easing: "easeOutQuint",
   duration: 1420
 });
 //account for index count
 if(index == 0){
 anime({
    targets: '#project-content-candy',
    opacity: [1, 0],
    easing: "easeOutQuint",
    duration: 220,
    complete: function(anim) {
      $("#project-content-candy").css('display', 'none');
     }
  });
}
if(index == 1){
  anime({
     targets: '#project-content-cntrl',
     opacity: [1, 0],
     easing: "easeOutQuint",
     duration: 220,
     complete: function(anim) {
      $("#project-content-cntrl").css('display', 'none');
     }
   });
 }
 if(index == 2){
  anime({
     targets: '#project-content-parsons',
     opacity: [1, 0],
     easing: "easeOutQuint",
     duration: 220,
     complete: function(anim) {
      $("#project-content-parsons").css('display', 'none');
     }
   });
 }
 if(index == 3){
  anime({
     targets: '#project-content-star',
     opacity: [1, 0],
     easing: "easeOutQuint",
     duration: 220,
     complete: function(anim) {
      $("#project-content-star").css('display', 'none');
     }
   });
 }
 if(index == 4){
  anime({
     targets: '#project-content-cook',
     opacity: [1, 0],
     easing: "easeOutQuint",
     duration: 220,
     complete: function(anim) {
      $("#project-content-cook").css('display', 'none');
     }
   });
 }

}
}

/*slide out animation event function*/
function slideOut(){
  slideActive = true;
  playSlide = true;
  anime({
    targets: '.carousel-text',
    translateY: [0 , -100],
    easing: "easeInQuint",
    duration: 520
  });
  
anime.timeline({loop: false})
  .add({
    targets: '#top .letter',
    translateY: [0 , 2000],
    easing: "easeInQuint",
    duration: 520
  })
  .add({
    targets: '#bottom .letter',
    translateY: [0 , 2000],
    easing: "easeInQuint",
    duration: 520
  },0)
  .add({
    targets: '#middle .letter',
    translateY: [0 , 2000],
    easing: "easeInQuint",
    duration: 520,
    complete: function(anim) {
    
    if(index == 0){
    firstSlideTitle();
    }
    if(index == 1){
    secondSlideTitle();
    }
    if(index == 2){
    thirdSlideTitle();
    }
    if(index == 3){
    fourthSlideTitle();
    }
    if(index == 4){
    fifthSlideTitle();
    }
    slideIn();
  }
  },0);
}

/*slide in animation event function*/
function slideIn(){
slideActive = true; 
anime.timeline({loop: false})
  .add({
    targets: '#top .letter',
    translateY: [2000 , 0],
    easing: "easeOutQuint",
    duration: 420,
    delay: (el, i) => 50 * i
  })
  .add({
    targets: '#bottom .letter',
    translateY: [2000 , 0],
    easing: "easeOutQuint",
    duration: 420,
    delay: (el, i) => 50 * i
  },0)
  .add({
    targets: '.carousel-text',
    translateY: [-100 , 0],
    easing: "easeOutQuint",
    duration: 420,
    delay: (el, i) => 50 * i
  },0)
  .add({
    targets: '#middle .letter',
    translateY: [2000 , 0],
    easing: "easeOutQuint",
    duration: 420,
    delay: (el, i) => 50 * i,
    complete: function(anim) {
    slideActive = false;
    /*slideInActive = false;*/
  }
  },0);
}

/*on scroll event function*/
function onScroll(e){

	if(slideActive == false  && !clickActive){   
    	var direction = (function () {

        	var delta = (e.type === 'DOMMouseScroll' ?
                     	e.originalEvent.detail * -40 :
                     	e.originalEvent.wheelDelta);

        	return delta > 0 ? 0 : 1;
    	}());

    	if(direction === 1) {
      	index += 1;
        if(index == 5){
    			index = 0;
    		}
      	slideOut();
       	console.log('scrolling down' + index);
    	}
    	if(direction === 0) {
      	index -= 1;
        if(index == -1){
    			index = 4;
    		}
        
      	slideOut();
       	console.log('scrolling up' + index);
      }
    }
}

/*event funtion when project is closed.*/
function clickedProjectExit() {
    setTimeout(function(){
        $(document.body).css("position", "fixed");
        $(document.body).css("overflow-y", "hidden");
        Scrollbar.destroyAll()
    }, 500);
    const scrollBar = Scrollbar.getAll();
    anime({
        targets: scrollBar,
        scrollTop: 0,
        duration: 500,
        easing: 'easeOutQuint'
    });
    console.log(scrollBar);
    //scrollBar.scrollTo(0, 0, 500);
     CLICKED = false;
     clickActive = false;
     caseLink.innerHTML = 'view case study';
     var textWrapper04 = document.querySelector('#case-link');
     textWrapper04.innerHTML = textWrapper04.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
     $("#x-button-container").css('opacity', '0');
     $("#project-content").css('opacity', '0');

         anime.timeline({loop: false})
         .add({
       targets: '#showcase',
       bottom: '0vh',
       easing: "easeOutQuint",
       duration: 1520
     });
      anime.timeline().add({
       targets: '.sliding-block.yellow',
           bottom: '0vh',
           easing: "easeOutQuint",
       duration: 1420
     });
     
     if(index == 0){
        anime({
           targets: '#project-content-candy',
           opacity: [1, 0],
           easing: "easeOutQuint",
           duration: 220,
           complete: function(anim) {
            $("#project-content-candy").css('display', 'none');
           }
         });
       }
       if(index == 1){
         anime({
            targets: '#project-content-cntrl',
            opacity: [1, 0],
            easing: "easeOutQuint",
            duration: 220,
            complete: function(anim) {
              $("#project-content-cntrl").css('display', 'none');
             }
          });
        }
        if(index == 2){
         anime({
            targets: '#project-content-parsons',
            opacity: [1, 0],
            easing: "easeOutQuint",
            duration: 220,
            complete: function(anim) {
              $("#project-content-parsons").css('display', 'none');
             }
          });
        }
        if(index == 3){
         anime({
            targets: '#project-content-star',
            opacity: [1, 0],
            easing: "easeOutQuint",
            duration: 220,
            complete: function(anim) {
              $("#project-content-star").css('display', 'none');
             }
          });
        }
        if(index == 4){
         anime({
            targets: '#project-content-cook',
            opacity: [1, 0],
            easing: "easeOutQuint",
            duration: 220,
            complete: function(anim) {
              $("#project-content-cook").css('display', 'none');
             }
          });
        }
    }
   
   
   /*slide out animation event function*/
   function slideOut(){
     slideActive = true;
     playSlide = true;
     anime({
       targets: '.carousel-text',
       translateY: [0 , -100],
       easing: "easeInQuint",
       duration: 520
     });
     
   anime.timeline({loop: false})
     .add({
       targets: '#top .letter',
       translateY: [0 , 2000],
       easing: "easeInQuint",
       duration: 520
     })
     .add({
       targets: '#bottom .letter',
       translateY: [0 , 2000],
       easing: "easeInQuint",
       duration: 520
     },0)
     .add({
       targets: '#middle .letter',
       translateY: [0 , 2000],
       easing: "easeInQuint",
       duration: 520,
       complete: function(anim) {
       
       if(index == 0){
       firstSlideTitle();
       }
       if(index == 1){
       secondSlideTitle();
       }
       if(index == 2){
       thirdSlideTitle();
       }
       if(index == 3){
       fourthSlideTitle();
       }
       if(index == 4){
       fifthSlideTitle();
       }
       slideIn();
     }
     },0);
   }
   
   /*slide in animation event function*/
   function slideIn(){
   slideActive = true; 
   anime.timeline({loop: false})
     .add({
       targets: '#top .letter',
       translateY: [2000 , 0],
       easing: "easeOutQuint",
       duration: 420,
       delay: (el, i) => 50 * i
     })
     .add({
       targets: '#bottom .letter',
       translateY: [2000 , 0],
       easing: "easeOutQuint",
       duration: 420,
       delay: (el, i) => 50 * i
     },0)
     .add({
       targets: '.carousel-text',
       translateY: [-100 , 0],
       easing: "easeOutQuint",
       duration: 420,
       delay: (el, i) => 50 * i
     },0)
     .add({
       targets: '#middle .letter',
       translateY: [2000 , 0],
       easing: "easeOutQuint",
       duration: 420,
       delay: (el, i) => 50 * i,
       complete: function(anim) {
       slideActive = false;
       /*slideInActive = false;*/
     }
     },0);
   }
   
   /*on scroll event function*/
   function onScroll(e){
   
       if(slideActive == false  && !clickActive){   
           var direction = (function () {
   
               var delta = (e.type === 'DOMMouseScroll' ?
                            e.originalEvent.detail * -40 :
                            e.originalEvent.wheelDelta);
   
               return delta > 0 ? 0 : 1;
           }());
   
           if(direction === 1) {
             index += 1;
           if(index == 5){
                   index = 0;
               }
             slideOut();
              console.log('scrolling down' + index);
           }
           if(direction === 0) {
             index -= 1;
           if(index == -1){
                   index = 4;
               }
           
             slideOut();
              console.log('scrolling up' + index);
         }
       }
   }

function buttonHover(){
  anime({
    targets: '#case-link .letter',
    translateY: [
      {value: -5, easing: 'easeOutSine', duration: 100},
      {value: 0, easing: 'easeInQuad', duration: 150}
    ],
    delay: anime.stagger(20, {from: 'first'})
    });

    if(index == 0){
        anime({
        targets: '#case-link .letter',
        color: '#ff675e',
        duration: 151
        });
    }
    if(index == 1){
        anime({
            targets: '#case-link .letter',
            color: '#FFEEB0',
            duration: 151
            });
    }
    if(index == 2){
        anime({
        targets: '#case-link .letter',
        color: '#e82e21',
        duration: 151
        });
    }
    if(index == 3){
        anime({
            targets: '#case-link .letter',
            color: '#590776',
            duration: 151
            });
    }
    if(index == 4){
        anime({
        targets: '#case-link .letter',
        color: '#1CA421',
        duration: 151
        });
    }
}


/* Function To Wrap Title of Projects*/
function textWrapTitle() {
  var textWrapper = document.querySelector('#top .letters');
	textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
	var textWrapper02 = document.querySelector('#middle .letters');
	textWrapper02.innerHTML = textWrapper02.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
	var textWrapper03 = document.querySelector('#bottom .letters');
  textWrapper03.innerHTML = textWrapper03.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
}
/*EVENTS*/
$(window).on('mousemove', moveText);
$(document).ready(initOnLoad);
$(window).on('mousewheel DOMMouseScroll swipe', onScroll);

$("#p-trig").mouseenter(function(){
  THREEMOUSEOVER = true;
  buttonHover();
});
$("#p-trig").mouseleave(function(){
    THREEMOUSEOVER = false;
    anime({
        targets: '#case-link .letter',
        color: '#FFF',
        duration: 151
        });
});

$("#p-trig").click(clickedProject);


$("#x-button").mouseenter(function(){
    if(index == 0){
        anime({
        targets: '#x-button-svg',
        fill: '#ff675e',
        duration: 151
        });
    }
    if(index == 1){
        anime({
            targets: '#x-button-svg',
            fill: '#FFEEB0',
            duration: 151
            });
    }
    if(index == 2){
        anime({
        targets: '#x-button-svg',
        fill: '#e82e21',
        duration: 151
        });
    }
    if(index == 3){
        anime({
            targets: '#x-button-svg',
            fill: '#590776',
            duration: 151
            });
    }
    if(index == 4){
        anime({
        targets: '#x-button-svg',
        fill: '#1CA421',
        duration: 151
        });
    }
});
$("#x-button").click(clickedProjectExit);
$("#x-button").mouseleave(function(){
    anime({
        targets: '#x-button-svg',
        fill: '#FFF',
        easing: 'easeOutSine',
        duration: 151
      });
});