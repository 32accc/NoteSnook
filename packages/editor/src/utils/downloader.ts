/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
export type DownloadOptions = {
  corsHost: string;
};

const UTITypes: Record<string, string> = {
  "com.microsoft.bmp": "image/bmp",
  "com.canon.crw-raw-image": "image/x-canon-crw",
  "com.adobe.raw-image": "image/x-adobe-dng",
  "com.dxo.raw-image": "image/x-dxo-dxo",
  "com.j2.efx-fax": "image/efax",
  "com.epson.raw-image": "image/x-epson-erf",
  "com.kodak.flashpix-image": "image/fpx",
  "com.compuserve.gif": "image/gif",
  "com.microsoft.ico": "image/vnd.microsoft.icon",
  "public.jpeg": "image/jpeg",
  "public.jpeg-2000": "image/jp2",
  "com.nikon.nrw-raw-image": "image/x-nikon-nrw",
  "com.apple.pict": "image/pict",
  "public.png": "image/png",
  "com.adobe.photoshop-image": "image/vnd.adobe.photoshop",
  "com.leica.pwl-raw-image": "image/x-leica-pwl",
  "com.apple.quicktime-image": "image/x-quicktime",
  "com.sgi.sgi-image": "image/sgi",
  "com.sony.sr2-raw-image": "image/x-sony-sr2",
  "public.svg-image": "image/svg+xml",
  "com.truevision.tga-image": "image/targa",
  "public.tiff": "image/tiff",
  "public.xbitmap-image": "image/x-xbitmap",
  "public.avci": "image/avci",
  "public.avcs": "image/avcs",
  "public.heic": "image/heic",
  "public.heif": "image/heif",
  "public.heics": "image/heic-sequence",
  "public.heifs": "image/heif-sequence"
};

export async function downloadImage(url: string, options?: DownloadOptions) {
  if (options?.corsHost && !url.startsWith("blob:"))
    url = `${options.corsHost}/${url}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`invalid status code ${response.status}`);

  let contentType = response.headers.get("Content-Type");
  const contentLength = response.headers.get("Content-Length");

  if (contentType && UTITypes[contentType]) contentType = UTITypes[contentType];

  if (
    !contentType ||
    !contentLength ||
    contentLength === "0" ||
    !contentType.startsWith("image/")
  )
    throw new Error("not an image");

  const size = parseInt(contentLength);
  let blob = await response.blob();
  if (UTITypes[blob.type])
    blob = new Blob([blob], {
      type: contentType
    });
  return {
    blob,
    url: URL.createObjectURL(blob),
    type: contentType,
    size
  };
}

export function toDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}

export function isDataUrl(url?: string): boolean {
  return url?.startsWith("data:") || false;
}

export async function toBlobURL(dataurl: string) {
  if (!isDataUrl(dataurl)) return dataurl;

  const response = await fetch(dataurl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
