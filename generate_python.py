import json

beginner_themes = [
    "My Daily Routine", "My Favorite Food", "My Favorite Hobby", "My Best Friend",
    "My Hometown", "My Family", "My Dream Vacation", "My Favorite Movie", "My Pet",
    "My Weekend", "My Morning Routine", "My Favorite Season", "My Favorite Color",
    "My Favorite Animal", "My School Days", "My Favorite Subject", "My First Job",
    "My Favorite Sport", "My Favorite Book", "My Hero", "My Favorite Holiday",
    "My Favorite Restaurant", "My Favorite Drink", "My Favorite Music", "My Favorite Singer",
    "My Favorite Actor", "My Favorite TV Show", "My Favorite Game", "My Favorite Memory",
    "My Favorite Outfit", "My Bedroom", "My House", "My Neighborhood", "My City",
    "My Country", "My Favorite Festival", "My Birthday", "My Favorite Gift", "My Phone",
    "My Computer", "My Favorite Website", "My Favorite App", "My Favorite Youtuber",
    "My Favorite Video", "My Favorite Joke", "My Favorite Story", "My Favorite Activity",
    "My Favorite Weather", "My Favorite Time of Day", "My Favorite Day of the Week",
    "My Favorite Month", "My Favorite Subject in School", "My Favorite Teacher",
    "My Favorite Classmate", "My Favorite Childhood Toy", "My Favorite Childhood Game",
    "My Favorite Childhood Memory", "My Favorite Childhood Friend", "My Favorite Place",
    "My Favorite Park", "My Favorite Museum", "My Favorite Zoo", "My Favorite Beach",
    "My Favorite Mountain", "My Favorite Lake", "My Favorite River", "My Favorite Forest",
    "My Favorite Flower", "My Favorite Tree", "My Favorite Fruit", "My Favorite Vegetable",
    "My Favorite Dessert", "My Favorite Snack", "My Favorite Breakfast", "My Favorite Lunch",
    "My Favorite Dinner", "My Favorite Meal", "My Favorite Recipe", "My Favorite Cafe",
    "My Favorite Shop", "My Favorite Mall", "My Favorite Market", "My Favorite Supermarket",
    "My Favorite Clothes", "My Favorite Shoes", "My Favorite Hat", "My Favorite Bag",
    "My Favorite Accessory", "My Favorite Jewelry", "My Favorite Watch", "My Favorite Glasses",
    "My Favorite Hairstyle", "My Favorite Makeup", "My Favorite Perfume", "My Favorite Car",
    "My Favorite Bike", "My Favorite Train", "My Favorite Bus", "My Favorite Plane",
    "My Favorite Boat"
]

intermediate_themes = [
    "The Impact of Social Media", "Online Shopping vs Traditional Shopping", "Living in a City vs Countryside",
    "The Importance of Exercise", "Healthy Eating Habits", "The Benefits of Reading",
    "Learning a Second Language", "The Role of Technology in Education", "Working from Home",
    "The Importance of Sleep", "Managing Stress", "The Value of Friendship",
    "Traveling Abroad", "Experiencing Different Cultures", "The Impact of Climate Change",
    "Protecting the Environment", "The Future of Transportation", "The Importance of Recycling",
    "The Benefits of Volunteering", "The Role of Art in Society", "The Importance of History",
    "The Impact of Advertising", "The Future of Space Exploration", "The Importance of Space Travel",
    "The Role of Science in Society", "The Impact of Artificial Intelligence", "The Future of Work",
    "The Importance of Renewable Energy", "The Benefits of Meditation", "The Importance of Mental Health",
    "The Impact of Fast Fashion", "The Benefits of Minimalism", "The Importance of Financial Literacy",
    "The Role of Government in Society", "The Impact of Fake News", "The Importance of Critical Thinking",
    "The Benefits of Studying Abroad", "The Impact of Tourism", "The Importance of Preserving Culture",
    "The Role of Music in Society", "The Impact of Video Games", "The Importance of Physical Education",
    "The Benefits of Learning to Play an Instrument", "The Impact of Reality TV",
    "The Importance of Public Transportation", "The Role of Libraries in Society",
    "The Impact of E-books", "The Importance of Face-to-Face Communication",
    "The Benefits of Unplugging from Technology", "The Role of Sports in Society",
    "The Impact of the Olympics", "The Importance of Teamwork", "The Benefits of Individual Sports",
    "The Role of Coaches in Sports", "The Impact of Professional Athletes as Role Models",
    "The Importance of Fair Play", "The Benefits of Outdoor Activities",
    "The Role of National Parks", "The Impact of Deforestation", "The Importance of Protecting Wildlife",
    "The Benefits of Organic Farming", "The Role of Zoos in Conservation",
    "The Impact of Plastic Pollution", "The Importance of Clean Water",
    "The Benefits of a Vegetarian Diet", "The Role of Fast Food in Society",
    "The Impact of Genetically Modified Foods", "The Importance of Food Security",
    "The Benefits of Home Cooking", "The Role of Restaurants in Society",
    "The Impact of the Gig Economy", "The Importance of Work-Life Balance",
    "The Benefits of Flexible Working Hours", "The Role of Trade Unions",
    "The Impact of Automation on Jobs", "The Importance of Continuous Learning",
    "The Benefits of Online Education", "The Role of Universities in Society",
    "The Impact of Student Debt", "The Importance of Scholarships",
    "The Benefits of Vocational Training", "The Role of Apprenticeships",
    "The Impact of the Gender Pay Gap", "The Importance of Diversity in the Workplace",
    "The Benefits of Mentorship", "The Role of Leadership in Business",
    "The Impact of Corporate Social Responsibility", "The Importance of Ethical Business Practices",
    "The Benefits of Supporting Local Businesses", "The Role of Entrepreneurs in Society",
    "The Impact of E-commerce", "The Importance of Consumer Rights",
    "The Benefits of Ethical Consumerism", "The Role of Advertising in Consumer Behavior",
    "The Impact of Influencer Marketing", "The Importance of Brand Loyalty",
    "The Benefits of Generic Brands", "The Role of Packaging in Marketing",
    "The Impact of Product Placement", "The Importance of Customer Service"
]

advanced_themes = [
    "Artificial Intelligence and the Future of Work", "Universal Basic Income",
    "The Ethics of Gene Editing", "The Commercialization of Space",
    "The Impact of Quantum Computing", "The Future of Democracy",
    "The Role of the United Nations", "Global Wealth Inequality",
    "The Ethics of Autonomous Weapons", "The Future of Privacy in the Digital Age",
    "The Impact of Deepfakes", "The Role of Cryptocurrencies",
    "The Future of the Global Economy", "The Ethics of Animal Testing",
    "The Impact of Overpopulation", "The Role of Nuclear Energy",
    "The Future of Healthcare", "The Ethics of Euthanasia",
    "The Impact of the Aging Population", "The Role of Traditional Medicine",
    "The Future of Human Evolution", "The Ethics of Cloning",
    "The Impact of the Metaverse", "The Role of Virtual Reality in Society",
    "The Future of the Internet", "The Ethics of Big Data",
    "The Impact of Algorithmic Bias", "The Role of Whistleblowers",
    "The Future of Journalism", "The Ethics of Citizen Journalism",
    "The Impact of the 24-Hour News Cycle", "The Role of Satire in Politics",
    "The Future of the European Union", "The Ethics of Border Control",
    "The Impact of Globalization", "The Role of International Trade",
    "The Future of Capitalism", "The Ethics of Consumerism",
    "The Impact of the Sharing Economy", "The Role of the World Bank",
    "The Future of Developing Nations", "The Ethics of Foreign Aid",
    "The Impact of Brain Drain", "The Role of the Diaspora",
    "The Future of Urbanization", "The Ethics of Gentrification",
    "The Impact of Smart Cities", "The Role of Public Spaces",
    "The Future of Architecture", "The Ethics of Sustainable Design",
    "The Impact of the Fast Fashion Industry", "The Role of the Circular Economy",
    "The Future of Agriculture", "The Ethics of Factory Farming",
    "The Impact of the Meat Industry on Climate Change", "The Role of Alternative Proteins",
    "The Future of Water Scarcity", "The Ethics of Water Privatization",
    "The Impact of Ocean Acidification", "The Role of Marine Protected Areas",
    "The Future of the Arctic", "The Ethics of Geoengineering",
    "The Impact of Carbon Capture Technology", "The Role of Carbon Pricing",
    "The Future of the Paris Agreement", "The Ethics of Climate Justice",
    "The Impact of Climate Refugees", "The Role of Indigenous Knowledge in Conservation",
    "The Future of Biodiversity", "The Ethics of De-extinction",
    "The Impact of Invasive Species", "The Role of Seed Banks",
    "The Future of Pandemics", "The Ethics of Vaccine Mandates",
    "The Impact of Antibiotic Resistance", "The Role of the World Health Organization",
    "The Future of Telemedicine", "The Ethics of Personalized Medicine",
    "The Impact of Wearable Health Technology", "The Role of Artificial Intelligence in Healthcare",
    "The Future of Mental Health Treatment", "The Ethics of Psychedelic Therapy",
    "The Impact of Social Isolation", "The Role of Community in Mental Health",
    "The Future of the Nuclear Family", "The Ethics of Surrogacy",
    "The Impact of Declining Birth Rates", "The Role of the State in Childcare",
    "The Future of Education", "The Ethics of Standardized Testing",
    "The Impact of the Flipped Classroom", "The Role of Artificial Intelligence in Education",
    "The Future of Lifelong Learning", "The Ethics of Meritocracy",
    "The Impact of Elite Universities", "The Role of the Arts in Education"
]

topics = []

def make_topic(diff, title, index):
    topic = {
        "id": f"{diff}-{index}-{title.lower().replace(' ', '-')}",
        "title": title,
        "difficulty": diff,
        "thinkAbout": [],
        "include": [],
        "challenge": ""
    }
    if diff == "beginner":
        topic["thinkAbout"] = [
            f"What is your experience with {title.lower()}?",
            "When did you first learn about this?",
            "Why is this interesting to you?",
            "Who do you usually talk to about this?"
        ]
        topic["include"] = [
            f"Explain what {title.lower()} means to you.",
            "Give one real-life example.",
            "Say why you like or dislike it."
        ]
        topic["challenge"] = "Try to give at least two specific reasons for your opinion."
    elif diff == "intermediate":
        topic["thinkAbout"] = [
            f"How does {title.lower()} affect everyday life?",
            "What are the biggest advantages of this?",
            "What are some disadvantages or problems?",
            "Has your own experience changed your opinion on this?"
        ]
        topic["include"] = [
            "A clear opinion on the topic.",
            "Two supporting reasons.",
            "One real-world example."
        ]
        topic["challenge"] = "Explain one advantage and one disadvantage before giving your final conclusion."
    else:
        topic["thinkAbout"] = [
            f"What are the long-term implications of {title.lower()}?",
            "Could this create as many problems as it solves?",
            "How might different groups of people view this differently?",
            "What role should society or government play in managing this?"
        ]
        topic["include"] = [
            "A clear and nuanced position.",
            "Supporting arguments with evidence.",
            "An opposing perspective and your counter-argument."
        ]
        topic["challenge"] = "Present your position, acknowledge an opposing view, and explain why you ultimately disagree with it."
    
    return topic

for i, t in enumerate(beginner_themes):
    if i >= 100: break
    topics.append(make_topic("beginner", t, i))

for i, t in enumerate(intermediate_themes):
    if i >= 100: break
    topics.append(make_topic("intermediate", t, i))

for i, t in enumerate(advanced_themes):
    if i >= 100: break
    topics.append(make_topic("advanced", t, i))

out = f"""import type {{ Topic, Difficulty }} from "./types"

export const TOPICS: Topic[] = {json.dumps(topics, indent=2)}

export function pickTopic(
  difficulty: Difficulty,
  recentIds: string[] = [],
  forceId?: string,
  preparationTime?: number
): Topic {{
  if (forceId) {{
    const found = TOPICS.find((t) => t.id === forceId)
    if (found) return found
  }}

  const pool = TOPICS.filter((t) => t.difficulty === difficulty)

  let available = pool.filter((t) => !recentIds.includes(t.id))
  if (available.length === 0) {{
    available = pool
  }}

  const selected = available[Math.floor(Math.random() * available.length)]

  return selected
}}
"""

with open("src/lib/topics.ts", "w") as f:
    f.write(out)
