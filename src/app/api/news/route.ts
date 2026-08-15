import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.newsPost.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch news posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch news posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.description || !body.category || !body.channel || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const post = await db.newsPost.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        channel: body.channel,
        date: body.date,
        icon: body.icon ?? null,
        gradient: body.gradient ?? null,
        border: body.border ?? null,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to create news post:", error);
    return NextResponse.json(
      { error: "Failed to create news post" },
      { status: 500 }
    );
  }
}
