<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class UploadController extends ResourceController
{
    public function uploadRewardImage()
    {
        $file = $this->request->getFile('image');

        if (!$file->isValid()) {
            return $this->fail($file->getErrorString());
        }

        $newName = $file->getRandomName();
        $file->move(FCPATH . '../uploads/rewards', $newName);

        return $this->respond([
            'status'   => 'success',
            'url'      => base_url('uploads/rewards/' . $newName),
            'filename' => $newName
        ]);
    }

    public function uploadTemplate()
    {
        $file = $this->request->getFile('template');

        if (!$file->isValid()) {
            return $this->fail($file->getErrorString());
        }

        if ($file->getClientMimeType() !== 'application/pdf') {
            return $this->fail('Solo se permiten archivos PDF.');
        }

        $newName = $file->getRandomName();
        $file->move(WRITEPATH . 'uploads/templates', $newName);

        return $this->respond([
            'status'   => 'success',
            'filename' => $newName
        ]);
    }
}
