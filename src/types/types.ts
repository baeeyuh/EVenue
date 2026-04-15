import { useState } from "react"

export type Organization = {
	id: string
	name: string
	logo: string
	location: string
	description: string
	venueCount: number
}

export type Venue = {
	id: string
	organizationId: string
	name: string
	organizationName?: string
	location: string
	capacity: number
	price: string
	image: string
	amenities: string[]
	rating: number
	reviewCount: number
	ownerName: string
	ownerInitials: string
	description?: string
	venueType?: string
	isAvailable?: boolean
}

export type AuthFields = {
	email: string
	password: string
	firstName?: string
	lastName?: string
}

// Reusable hook for auth form fields. Import and use in components:
// const { email, setEmail, password, setPassword, firstName, setFirstName, lastName, setLastName } = useAuthFields()
export function useAuthFields(initial?: Partial<AuthFields>) {
	const [email, setEmail] = useState(initial?.email ?? "")
	const [password, setPassword] = useState(initial?.password ?? "")
	const [firstName, setFirstName] = useState(initial?.firstName ?? "")
	const [lastName, setLastName] = useState(initial?.lastName ?? "")

	return {
		email,
		setEmail,
		password,
		setPassword,
		firstName,
		setFirstName,
		lastName,
		setLastName,
	} as const
}
