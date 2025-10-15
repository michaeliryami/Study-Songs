# Study Songs

An AI-powered educational platform that transforms study notes into memorable musical jingles using advanced machine learning models. Deployed to production with full-stack architecture and subscription-based monetization.

## Project Structure

```
Study-Songs/
├── app/                    # Next.js 14 app directory
│   ├── components/         # Reusable React components
│   ├── api/               # API routes and serverless functions
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React context providers
│   └── lib/               # Utility functions and configurations
├── public/                # Static assets and favicon files
├── styles/                # Global CSS and styling
├── package.json          # Dependencies and scripts
└── README.md              # This file
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This will start the application at:
- **Frontend**: http://localhost:3000

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Frontend

The frontend is a Next.js 14 application built with:
- **Next.js 14** with App Router for modern React development
- **TypeScript** for type safety and developer experience
- **Chakra UI** for accessible, responsive UI components
- **React Hooks** for state management and custom logic

### Features  
- **AI-Powered Generation**: OpenAI GPT-4 for lyrics + Replicate music synthesis models
- **Interactive Flashcards**: Audio playback with navigation controls and keyboard shortcuts
- **Real-time Editing**: Live updates to study materials with instant saving
- **Subscription System**: Stripe integration with tier-based access control
- **Audio Management**: MP3 downloads, stitching, and cloud storage
- **Mobile Responsive**: Optimized for all device sizes with touch controls
- **Custom Genres**: Premium users can specify unique music styles

## Backend

The backend uses Next.js API routes with:
- **Serverless Functions** for scalable API endpoints
- **TypeScript** for type safety across the stack
- **Supabase Integration** for database and authentication
- **Stripe Webhooks** for automated subscription management

### Features  
- **AI Integration**: OpenAI GPT-4 and Replicate API for content generation
- **Audio Processing**: Server-side MP3 generation, concatenation, and stitching
- **Subscription Management**: Automated webhook handling for plan changes
- **File Storage**: Supabase Storage for persistent audio file management
- **Token System**: Credit-based usage tracking with monthly resets
- **Security**: Row Level Security (RLS) and JWT authentication

## Key Pages
- `/` Landing page with feature overview and pricing
- `/create` Create new study sets with AI generation
- `/my-sets` Manage existing study sets and view analytics
- `/pricing` Subscription plans and Stripe checkout
- `/auth` Authentication with email verification
- `/flashcard/:id` Interactive learning interface with audio controls

## AI & Music Generation

### Technical Pipeline
1. **Content Analysis**: GPT-4 processes study notes to extract key concepts
2. **Lyrics Generation**: Creates memorable, educational lyrics with mnemonic devices
3. **Music Synthesis**: Replicate's state-of-the-art models generate genre-specific audio
4. **Quality Enhancement**: Server-side processing for optimal audio quality
5. **Storage Optimization**: Efficient MP3 compression and cloud storage

### Supported Features
- **Multiple Genres**: Pop, Rock, Hip-Hop, Country, Electronic, Jazz, Classical, Reggae, Blues
- **Custom Genres**: Premium users can specify unique music styles
- **Audio Stitching**: Combine multiple jingles into cohesive study playlists
- **Real-time Generation**: Instant audio creation with progress tracking

## Database & Storage

### Supabase Integration
- **PostgreSQL Database**: User profiles, study sets, and subscription data
- **Row Level Security**: Database-level access control and data protection
- **Real-time Subscriptions**: Live updates for collaborative features
- **File Storage**: Persistent audio storage with public URL generation

### Schema Design
- **Users Table**: Profile management with subscription tiers and token tracking
- **Sets Table**: Study set metadata with JSON jingle storage
- **Audio Storage**: Supabase buckets with optimized file management
- **Subscription Tracking**: Stripe integration with automated updates

## Payment & Subscription

### Stripe Integration
- **Secure Checkout**: PCI-compliant payment processing
- **Customer Portal**: Self-service subscription management
- **Webhook Automation**: Real-time subscription updates
- **Multi-tier System**: Free, Basic ($10/month), Premium ($14/month)

### Business Model
- **Free Plan**: 1 study set, 10 tokens, basic features
- **Basic Plan**: 100 credits/month, pre-set genres, MP3 downloads
- **Premium Plan**: Unlimited credits, custom genres, audio stitching

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Stripe account
- OpenAI API key
- Replicate API key

### Environment Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Copy `.env.local.example` to `.env.local` and configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `OPENAI_API_KEY`
   - `REPLICATE_API_TOKEN`
4. Run `npm run dev` to start development server

### Database Setup
Run the provided SQL scripts in Supabase:
- `add-tokens-system.sql` - Token and subscription system
- `fix-constraint.sql` - Database constraints
- `add-stitch-column.sql` - Audio stitching functionality

## Deployment

### Vercel Deployment
- **Automatic Deployments**: Git-based CI/CD with Vercel
- **Environment Variables**: Secure API key management
- **Custom Domain**: SSL certificates and DNS configuration
- **Performance Optimization**: Global CDN and edge functions

### Production Checklist
- [ ] Configure all environment variables
- [ ] Set up Supabase database with RLS policies
- [ ] Configure Stripe webhooks for production
- [ ] Test audio generation and storage
- [ ] Verify subscription functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes in the appropriate directory
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

ISC