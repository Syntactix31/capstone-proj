// app/api/reviews/route.js

import axios from "axios";

export async function GET() {
  const serpApiKey = process.env.SERP_API_KEY;

  const dataId = "0x537163001a82a44d:0x6501feae9dbe49fe"; // <-- from Maps Place

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_maps_reviews",
        data_id: dataId,
        api_key: serpApiKey,


        // THIS SINGLE LINE OF CODE WAS WRECKING EVERYTHING FML
        // sort_by: "qualityScore",




      },
    });

    const reviews = data.reviews?.map((r) => ({
      name: typeof r.username === "string"
        ? r.username
        : r.user && typeof r.user.name === "string"
        ? r.user.name
        : "Anonymous",
      text: typeof r.description === "string"
        ? r.description
        : typeof r.snippet === "string"
        ? r.snippet
        : "No review text available.",
      rating: typeof r.rating === "number" ? r.rating : 0,
    })) ?? [];


    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);

    const fallback = [
      {
        name: "Dick B.",
        text: "Amazing work. Clean, professional, and fast. Highly recommend!",
        rating: 5,
      },
      {
        name: "Edith P.",
        text: "They transformed our yard completely. Communication was excellent.",
        rating: 5,
      },
      {
        name: "Mike O.",
        text: "On time, fair pricing, and great attention to detail.",
        rating: 5,
      },
      {
        name: "Nick G.",
        text: "Best landscaping experience we've ever had.",
        rating: 5,
      },
      {
        name: "Ben D.",
        text: "Work quality exceeded expectations. Will hire again.",
        rating: 5,
      },
    ];

    return Response.json(fallback);
  }

}


// const fallback = [
//   {
//     name: "Dick B.",
//     text: "Amazing work. Clean, professional, and fast. Highly recommend!",
//   },
//   {
//     name: "Edith P.",
//     text: "They transformed our yard completely. Communication was excellent.",
//   },
//   {
//     name: "Mike O.",
//     text: "On time, fair pricing, and great attention to detail.",
//   },
//   {
//     name: "Nick G.",
//     text: "Best landscaping experience we've ever had.",
//   },
//   {
//     name: "Ben D.",
//     text: "Work quality exceeded expectations. Will hire again.",
//   },
// ];

