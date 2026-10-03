import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

// TODO(pilot): set the contact address for privacy requests before inviting pilot users.
const CONTACT_EMAIL: string | null = null

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </section>
  )
}

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto max-w-prose space-y-6 p-6 text-sm leading-relaxed">
      <Button variant="ghost" className="-ml-3" onClick={() => void navigate(-1)}>
        ← Back
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="text-muted-foreground">
        Supertrainer is a small pilot. This notice explains, in plain terms, what we keep about you
        and why.
      </p>

      <Section title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your name, email address and profile photo, from Google or the email you sign in with.
          </li>
          <li>Your settings, such as whether you use kg or lb.</li>
          <li>
            Your training plans and the workouts you log: exercises, sets, reps, weights and notes.
          </li>
          <li>Your answers to the intake questionnaire, and bodyweight entries if you add them.</li>
          <li>Feedback you send us, with the page you sent it from.</li>
        </ul>
      </Section>

      <Section title="Health information">
        <p>
          The questionnaire asks about injuries and areas to be careful with. This is health
          information, which UK data protection law treats as special category data. We only ask for
          it, and only store it, if you tick the consent box. You can leave it out and still use the
          app. You can withdraw consent at any time by deleting your account, or by asking us to
          remove those answers.
        </p>
      </Section>

      <Section title="Why we use it">
        <p>
          To run the app for you: so your trainer can plan your training and you can both see your
          progress. Feedback helps us improve the pilot. We don’t sell your data, show ads, or use
          tracking cookies.
        </p>
      </Section>

      <Section title="Who can see it">
        <ul className="list-disc space-y-1 pl-5">
          <li>You.</li>
          <li>
            Your trainer, while you’re linked to them. When the link ends they can no longer see
            your data.
          </li>
          <li>
            If you’re a trainer, your name and photo appear in the trainer list for other users.
          </li>
          <li>The people running the pilot, to keep the service working and to read feedback.</li>
        </ul>
      </Section>

      <Section title="Where it’s stored">
        <p>
          In a Supabase database hosted in the EU (London where available). The app itself is served
          by GitHub Pages, which doesn’t receive your training data. Your browser stores your
          sign-in and any unsynced workout on your device.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Until you delete your account. You can do this at any time from Settings, and it removes
          your data permanently.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask for a copy of your data, ask us to correct or delete it, or object to how we
          use it.{' '}
          {CONTACT_EMAIL ? (
            <>
              Email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            'Ask your trainer for the pilot organiser’s contact details.'
          )}{' '}
          If you’re unhappy with how we handle your data, you can complain to the Information
          Commissioner’s Office (ico.org.uk).
        </p>
      </Section>
    </main>
  )
}
