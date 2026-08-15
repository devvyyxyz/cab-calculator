import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await db.newsPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "News post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to fetch news post:", error);
    return NextResponse.json(
      { error: "Failed to fetch news post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const post = await db.newsPost.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        channel: body.channel,
        date: body.date,
        icon: body.icon ?? null,
        gradient: body.gradient ?? null,
        border: body.border ?? null,
        published: body.published ?? undefined,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to update news post:", error);
    return NextResponse.json(
      { error: "Failed to update news post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.newsPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete news post:", error);
    return NextResponse.json(
      { error: "Failed to delete news post" },
      { status: 500 }
    );
  }
}
