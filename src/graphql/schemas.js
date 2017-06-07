export default `

type User {
  id: Int!
  email: String!
  firstName: String
  lastName: String
}

type Collective {
  id: Int!
  slug: String!
  name: String
}

type Tier {
  id: Int!
  name: String
  description: String
  amount: Int
  currency: String
  maxQuantity: Int
  availableQuantity: Int
  password: String
  startsAt: String
  endsAt: String
  event: Event
  responses: [Response]
}

type Response {
  id: Int!
  user: User
  description: String
  collective: Collective
  event: Event
  quantity: Int!
  status: String
  confirmedAt: String
}

type Event {
  id: Int!
  slug: String!
  name: String
  description: String
  backgroundImage: String
  createdByUser: User
  collective: Collective
  locationName: String
  address: String
  lat: Float
  long: Float
  startsAt: String
  endsAt: String
  maxAmount: Int
  maxQuantity: Int
  currency: String
  tiers: [Tier]
  responses: [Response]
}

`;