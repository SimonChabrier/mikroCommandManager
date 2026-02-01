<?php

namespace App\Service;

use App\Entity\Command;
use Doctrine\ORM\EntityManagerInterface;

class CommandService
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    /**
     * Find all commands.
     * @return array<int, array{id: int, description: string, command: string}>
     */
    public function findAll(): array
    {
        $commands = $this->em->getRepository(Command::class)->findBy([], ['createdAt' => 'DESC']);

        return array_map(fn(Command $cmd) => [
            'id' => $cmd->getId(),
            'description' => $cmd->getDescription(),
            'command' => $cmd->getCommand(),
        ], $commands);
    }

    /**
     * Create a new command.
     * @return array{id: int, description: string, command: string}
     */
    public function create(string $description, string $command): array
    {
        $cmd = new Command();
        $cmd
            ->setDescription($description)
            ->setCommand($command)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTime());

        $this->em->persist($cmd);
        $this->em->flush();

        return [
            'id' => $cmd->getId(),
            'description' => $cmd->getDescription(),
            'command' => $cmd->getCommand(),
        ];
    }

    /**
     * Update a command by its id.
     * @return array{id: int, description: string, command: string}|null
     */
    public function update(int $id, ?string $description, ?string $command): ?array
    {
        $cmd = $this->em->getRepository(Command::class)->find($id);
        if (!$cmd) {
            return null;
        }

        if ($description !== null) {
            $cmd->setDescription($description);
        }
        if ($command !== null) {
            $cmd->setCommand($command);
        }
        $cmd->setUpdatedAt(new \DateTime());

        $this->em->flush();

        return [
            'id' => $cmd->getId(),
            'description' => $cmd->getDescription(),
            'command' => $cmd->getCommand(),
        ];
    }

    /**
     * Delete a command by its id.
     * @return bool
     */
    public function delete(int $id): bool
    {
        $cmd = $this->em->getRepository(Command::class)->find($id);
        if (!$cmd) {
            return false;
        }

        $this->em->remove($cmd);
        $this->em->flush();

        return true;
    }
}
