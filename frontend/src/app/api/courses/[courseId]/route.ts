import { NextResponse } from 'next/server';

type Props = {
  params: {
    courseId: string
  }
}

export async function GET(
  _request: Request,
  { params }: Props
) {
  try {
    const response = await fetch(`https://api.umd.io/v1/courses/${params.courseId}`);

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    );
  }
}