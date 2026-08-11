"use client";
import type { ComponentProps } from "react";
import MyPopokClient from "@/app/my-popok/MyPopokClient";

export type ArtistEditorPermissions = { editProfile: boolean; editWorks: boolean; editHistory: boolean; changeOwner: boolean; changePublishStatus: boolean; deleteArtist: boolean };
export type ArtistEditorProps = ComponentProps<typeof MyPopokClient> & { accessMode?: "owner" | "admin"; permissions?: Partial<ArtistEditorPermissions> };
export default function ArtistEditor({ accessMode = "owner", permissions: _permissions, ...props }: ArtistEditorProps) {
  return <MyPopokClient {...props} adminMode={accessMode === "admin" || props.adminMode} />;
}
