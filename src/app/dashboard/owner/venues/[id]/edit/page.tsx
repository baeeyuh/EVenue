import OwnerVenueEditorContent from "@/components/owner/OwnerVenueEditorContent"

type Props = {
  params: Promise<{ id: string }>
}

export default async function OwnerEditVenuePage({ params }: Props) {
  const { id } = await params

  return <OwnerVenueEditorContent mode="edit" venueId={id} />
}
