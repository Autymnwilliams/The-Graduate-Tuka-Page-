/** Fake reviewer names + category-flavored review text used only by the demo seeding endpoint. */

export const FAKE_REVIEWER_NAMES = [
  "Sarah M.",
  "James T.",
  "Priya K.",
  "Daniel R.",
  "Emily Chen",
  "Marcus B.",
  "Ava Rodriguez",
  "Noah P.",
  "Grace L.",
  "Ethan W.",
  "Olivia S.",
  "Liam Fitzgerald",
  "Sophia N.",
  "Jackson H.",
  "Mia Alvarez",
  "Lucas G.",
  "Chloe D.",
  "Ryan O.",
  "Zoe Bennett",
  "Caleb J.",
  "Isabella F.",
  "Tyler M.",
  "Hannah K.",
  "Andre Wilson",
];

export const FAKE_STAY_LENGTHS = [
  "1 night",
  "2 nights",
  "3 nights",
  "4 nights",
  "a week",
  "weekend trip",
  undefined,
  undefined,
];

const REVIEW_TEMPLATES: Record<string, string[]> = {
  dining: [
    "We stumbled onto {name} on our first night and ended up going back twice more during our stay. Everything we ordered was great.",
    "{name} was exactly the kind of local spot we were hoping to find. Friendly staff, solid portions, and it didn't feel touristy at all.",
    "Grabbed a table here on the hotel's recommendation and it did not disappoint. Would go back in a heartbeat.",
    "Good food, reasonable prices, and close enough to walk. Can't ask for much more on a short trip.",
    "This ended up being the best meal of our whole trip. Glad the front desk pointed us here.",
    "Solid choice for dinner — nothing fancy, just really well done.",
    "We were skeptical since it was recommended by the hotel, but honestly it lived up to the hype.",
    "Came here twice because the first visit was so good. Consistent quality both times.",
  ],
  coffee: [
    "Perfect spot to start the morning before heading out to explore. Great coffee, friendly baristas.",
    "Found myself coming back here every morning of our stay. Consistently good and never too crowded.",
    "Nice change of pace from hotel coffee. Good wifi too if you need to get some work done.",
    "Cozy little spot, easy walk from the hotel. Would recommend for a quick coffee before checkout.",
    "Great espresso and a relaxed vibe. Wish we had one of these back home.",
    "Quick stop turned into an hour of people-watching with a great cup of coffee. No complaints.",
  ],
  nightlife: [
    "Had a great time here on our last night in town. Good drinks, good energy.",
    "Recommended by the front desk and it didn't disappoint — great spot for a nightcap.",
    "Solid drink menu and a laid-back crowd. Easy walk back to the hotel after.",
    "We came for one drink and stayed for three. Really enjoyed the atmosphere.",
    "Good place to unwind after a long day of sightseeing. Friendly bartenders.",
    "Exactly the kind of casual, unpretentious bar we were hoping to find nearby.",
  ],
  outdoors: [
    "Beautiful spot for a morning walk before checking out. Well worth the short trip from the hotel.",
    "Took a walk here in the evening and it was one of the highlights of the trip.",
    "Peaceful, well-maintained, and a nice break from the city. Glad we made time for it.",
    "Great photo spot and a nice way to spend an hour outdoors during our stay.",
    "Quiet and scenic — perfect if you need a break from sightseeing.",
    "Wasn't expecting much but ended up spending way longer here than planned. Really pretty.",
  ],
  shopping: [
    "Spent way longer browsing here than I planned to. Great selection and friendly staff.",
    "Picked up a couple of gifts here before heading home. Glad the hotel pointed us here.",
    "Fun little stop between meals. Found some things I wasn't expecting to find.",
    "Charming shop, easy walk from the hotel. Worth setting aside some time for.",
    "Ended up buying more than I meant to — in the best way. Great browsing.",
  ],
  culture: [
    "A nice, quiet way to spend an afternoon during our stay. Well worth the visit.",
    "Didn't expect to spend as much time here as we did — genuinely interesting.",
    "Great low-key activity between meals. Glad we made time for it.",
    "Small but well done. Worth the short trip from the hotel.",
    "A nice break from the usual tourist stuff. Would recommend to anyone staying nearby.",
  ],
};

const DEFAULT_TEMPLATES = REVIEW_TEMPLATES.dining;

/** Review text templates for a category, with a generic fallback for unknown categories. */
export function reviewTemplatesFor(category: string): string[] {
  return REVIEW_TEMPLATES[category] ?? DEFAULT_TEMPLATES;
}
