mapboxgl.accessToken = 'pk.eyJ1IjoicmVoYW45NCIsImEiOiJja3JyaTU4dTgxM2NqMm9td2kzMWFybGxoIn0.C9L4uziLBmfAYdhiQekjEw';
const map = new mapboxgl.Map ({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: campground.geometry.coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});

new mapboxgl.Marker()
.setLngLat(campground.geometry.coordinates)
.setPopup(
    new mapboxgl.Popup({offset: 25})
    .setHTML(
        `<h3>${campground.title}</h3><p>${campground.location}</p>`
    )
)
.addTo(map);


        